import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync } from "fs";
import { readFile, unlink } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { fileTypeFromBuffer } from "file-type";
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import os from "os";
import path from "path";

const tempDir = os.tmpdir();
const execAsync = promisify(exec);


const connection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
});

connection.on("error", (err) => {
  console.error("Redis connection error:", err);
});

connection.on("connect", () => {
  console.log("Redis connected successfully");
});

const prescriptionQueue = new Queue("prescription-ocr", {
  connection,
  defaultJobOptions: {
    removeOnComplete: false, 
    removeOnFail: false, 
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    jobTtl: 60 * 60 * 1000, 
  },
});

const worker = new Worker(
  "prescription-ocr",
  async (job) => {

    try {
      const { imageBuffer, userId, doctorInfo } = job.data;

      if (!imageBuffer || !userId) {
        throw new Error("Missing required job data: imageBuffer or userId");
      }

      const processor = new PrescriptionOCRProcessor(
        process.env.GOOGLE_API_KEY,
        {
          useQueue: false,
        }
      );

      const result = await processor._processImageInternal(
        imageBuffer,
        userId,
        doctorInfo
      );
      return result;
    } catch (error) {
      throw error;
    }
  },
  {
    connection,
    concurrency: 3, 
    maxStalledCount: 1,
    stalledInterval: 30 * 1000,
  }
);

// Enhanced worker event handlers
worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, {
    jobId: job?.id,
    error: err.message,
    stack: err.stack,
    attemptsMade: job?.attemptsMade,
    timestamp: new Date().toISOString(),
  });
});

worker.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed successfully:`, {
    jobId: job.id,
    resultId: result?.id,
    timestamp: new Date().toISOString(),
  });
});

worker.on("stalled", (jobId) => {
  console.warn(`Job ${jobId} stalled and will be retried`);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

setInterval(async () => {
  try {
    await prescriptionQueue.clean(60 * 60 * 1000, 100, "completed");
    await prescriptionQueue.clean(2 * 60 * 60 * 1000, 100, "failed");
  } catch (error) {
    console.error("Job cleanup error:", error);
  }
}, 10 * 60 * 1000);

export class PrescriptionOCRProcessor {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error("Google API key is required");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    this.useQueue = options.useQueue !== false;
  }

  async validateImage(buffer) {
    try {
      if (!Buffer.isBuffer(buffer)) {
        return false;
      }

      if (buffer.length === 0) {
        return false;
      }

      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error("Image file too large (max 10MB)");
      }

      const type = await fileTypeFromBuffer(buffer);
      if (!type) return false;

      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      return validTypes.includes(type.mime);
    } catch (error) {
      console.error("Image validation error:", error);
      return false;
    }
  }

  async compressImage(inputPath, outputPath) {
    try {

      await execAsync(
        `ffmpeg -i "${inputPath}" -vf "scale='if(gt(iw,800),800,-1)':'if(gt(ih,800),800,-1)'" -q:v 3 -y "${outputPath}"`
      );

      return outputPath;
    } catch (error) {
      await execAsync(`cp "${inputPath}" "${outputPath}"`);
      return outputPath;
    }
  }

  async processImageToPrescription(imageBuffer, userId, doctorInfo = {}) {
    
    if (!imageBuffer || !userId) {
      throw new Error("Image buffer and user ID are required");
    }

    const isValidImage = await this.validateImage(imageBuffer);
    if (!isValidImage) {
      throw new Error("Invalid image format or corrupted image");
    }

    if (this.useQueue) {
      try {
        const job = await prescriptionQueue.add(
          "process-prescription",
          {
            imageBuffer: {
              type: "Buffer",
              data: Array.from(imageBuffer),
            },
            userId,
            doctorInfo,
          },
          {
            priority: 1,
            delay: 0,
          }
        );


        return {
          jobId: job.id,
          status: "queued",
          message: "OCR processing queued successfully",
        };
      } catch (error) {
        return await this._processImageInternal(
          imageBuffer,
          userId,
          doctorInfo
        );
      }
    } else {
      return await this._processImageInternal(imageBuffer, userId, doctorInfo);
    }
  }

  async _processImageInternal(imageBuffer, userId, doctorInfo = {}) {

    let buffer = imageBuffer;
    if (imageBuffer && imageBuffer.type === "Buffer") {
      buffer = Buffer.from(imageBuffer.data);
    }

    if (!Buffer.isBuffer(buffer)) {
      throw new Error("Invalid image buffer provided");
    }

    const timestamp = Date.now();
    const tempInput = path.join(tempDir, `input_${timestamp}_${userId}.jpg`);
    const tempCompressed = path.join(
      tempDir,
      `compressed_${timestamp}_${userId}.jpg`
    );

    try {
      writeFileSync(tempInput, buffer);

      await this.compressImage(tempInput, tempCompressed);

      const compressedBuffer = await readFile(tempCompressed);

      const extractedData = await this.extractTextFromImage(compressedBuffer);

      const prescriptionData = await this.parsePrescriptionText(
        extractedData,
        userId,
        doctorInfo
      );

      return prescriptionData;
    } catch (error) {
      throw error;
    } finally {
      try {
        await unlink(tempInput).catch(() => {});
        await unlink(tempCompressed).catch(() => {});
        console.log("Temp files cleaned up");
      } catch (cleanupError) {
        console.warn("Temp file cleanup warning:", cleanupError.message);
      }
    }
  }

  async extractTextFromImage(imageBuffer) {
    try {
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg",
        },
      };

      const prompt = `Extract all prescription information from this image. 
      Be thorough and accurate. Include:
      - Doctor name and specialty
      - Date of prescription
      - All medicines with complete details
      
      Return ONLY valid JSON with this exact structure:
      {
        "doctor": "string",
        "specialty": "string", 
        "date": "ISO date string",
        "medicines": [
          {
            "name": "string",
            "dosage": "string",
            "frequency": "string",
            "duration": "string",
            "instruction": "string"
          }
        ]
      }`;

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);

        if (!jsonData.medicines || !Array.isArray(jsonData.medicines)) {
          throw new Error("Invalid JSON structure: medicines array missing");
        }

        return jsonData;
      }

      throw new Error("Could not extract valid JSON from image");
    } catch (error) {
      console.error("Text extraction error:", error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  async parsePrescriptionText(ocrResult, userId, doctorInfo = {}) {
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);

      const medicines = (ocrResult.medicines || []).map((med, index) => ({
        id: `med_${timestamp}_${index}_${randomId}`,
        name: med.name || "Unknown Medicine",
        dosage: med.dosage || "N/A",
        frequency: med.frequency || "N/A",
        duration: med.duration || "N/A",
        instruction: med.instruction || "N/A",
        status: "active",
        prescriptionId: null,
      }));

      const prescription = {
        id: `pres_${timestamp}_${randomId}`,
        doctor: ocrResult.doctor || doctorInfo.name || "Unknown Doctor",
        specialty:
          ocrResult.specialty || doctorInfo.specialty || "General Medicine",
        date: ocrResult.date || new Date().toISOString(),
        status: "completed",
        userId: userId,
        medicines: medicines,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      medicines.forEach((med) => {
        med.prescriptionId = prescription.id;
      });

      return prescription;
    } catch (error) {
      console.error("Prescription parsing error:", error);
      throw new Error(`Failed to parse prescription data: ${error.message}`);
    }
  }

  static async getJobStatus(jobId) {
    if (!jobId) {
      return { status: "unknown", error: "Job ID is required" };
    }

    try {

      const job = await Job.fromId(prescriptionQueue, jobId);

      if (!job) {
        return { status: "unknown" };
      }

      const state = await job.getState();

      const progress = job.progress;

      switch (state) {
        case "completed":
          const result = job.returnvalue;
          return {
            status: "completed",
            result,
            completedAt: job.processedOn,
          };

        case "failed":
          const error = job.failedReason;
          return {
            status: "failed",
            error,
            failedAt: job.failedOn,
            attemptsMade: job.attemptsMade,
          };

        case "active":
          return {
            status: "active",
            message: "Job is currently being processed",
            startedAt: job.processedOn,
          };

        case "waiting":
        case "delayed":
          return {
            status: "pending",
            message: `Job is ${state}`,
            createdAt: job.timestamp,
          };

        default:
          return {
            status: state,
            message: `Job is ${state}`,
          };
      }
    } catch (error) {
      return {
        status: "error",
        error: `Failed to check job status: ${error.message}`,
      };
    }
  }

  static async getAllJobs(status = null) {
    try {
      const jobs = status
        ? await prescriptionQueue.getJobs([status])
        : await prescriptionQueue.getJobs([
            "waiting",
            "active",
            "completed",
            "failed",
          ]);

      return jobs.map((job) => ({
        id: job.id,
        status: job.finishedOn
          ? "completed"
          : job.failedOn
          ? "failed"
          : "active",
        createdAt: job.timestamp,
        processedAt: job.processedOn,
        data: job.data,
      }));
    } catch (error) {
      console.error("Error getting all jobs:", error);
      return [];
    }
  }

  static async cleanupOldJobs(olderThanHours = 24) {
    try {
      const olderThan = olderThanHours * 60 * 60 * 1000;
      await prescriptionQueue.clean(olderThan, 100, "completed");
      await prescriptionQueue.clean(olderThan, 100, "failed");
    } catch (error) {
      console.error("Job cleanup error:", error);
    }
  }
}

process.on("SIGTERM", async () => {
  console.log("Shutting down worker gracefully...");
  await worker.close();
  await connection.quit();
  process.exit(0);
});

export default PrescriptionOCRProcessor;
