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
  enableReadyCheck: false,
});

const prescriptionQueue = new Queue("prescription-ocr", { connection });

const worker = new Worker(
  "prescription-ocr",
  async (job) => {
    const { imageBuffer, userId, doctorInfo } = job.data;
    const processor = new PrescriptionOCRProcessor(process.env.GEMINI_API_KEY, {
      useQueue: false,
    });
    return await processor._processImageInternal(
      imageBuffer,
      userId,
      doctorInfo
    );
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

export class PrescriptionOCRProcessor {
  constructor(apiKey, options = {}) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    this.useQueue = options.useQueue !== false;
  }

  async validateImage(buffer) {
    try {
      const type = await fileTypeFromBuffer(buffer);
      if (!type) return false;
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      return validTypes.includes(type.mime);
    } catch {
      return false;
    }
  }

  async compressImage(inputPath, outputPath) {
    await execAsync(
      `ffmpeg -i ${inputPath} -vf scale=800:-1 -q:v 2 ${outputPath}`
    );
    return outputPath;
  }

  async processImageToPrescription(imageBuffer, userId, doctorInfo = {}) {
    if (this.useQueue) {
      const job = await prescriptionQueue.add(
        "process-prescription",
        { imageBuffer, userId, doctorInfo },
        {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
        }
      );
      return { jobId: job.id, status: "queued" };
    } else {
      return await this._processImageInternal(imageBuffer, userId, doctorInfo);
    }
  }

  async _processImageInternal(imageBuffer, userId, doctorInfo = {}) {
    const buffer =
      imageBuffer && imageBuffer.type === "Buffer"
        ? Buffer.from(imageBuffer.data)
        : imageBuffer;

    if (!Buffer.isBuffer(buffer)) {
      throw new Error("Invalid image buffer provided");
    }

    const tempInput = path.join(tempDir, `input_${Date.now()}.jpg`);
    const tempCompressed = path.join(tempDir, `compressed_${Date.now()}.jpg`);

    writeFileSync(tempInput, buffer);
    await this.compressImage(tempInput, tempCompressed);
    const compressedBuffer = await readFile(tempCompressed);

    const result = await this.extractTextFromImage(compressedBuffer);
    const prescriptionData = await this.parsePrescriptionText(
      result,
      userId,
      doctorInfo
    );

    await unlink(tempInput);
    await unlink(tempCompressed);

    return prescriptionData;
  }

  async extractTextFromImage(imageBuffer) {
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: "image/jpeg",
      },
    };

    const result = await this.model.generateContent([
      "Extract all prescription information from this image. Include doctor name, specialty, date, and all medicines with their details (name, dosage, frequency, duration, instructions). Return ONLY valid JSON with this structure: {doctor: string, specialty: string, date: ISODateString, medicines: [{name: string, dosage: string, frequency: string, duration: string, instruction: string}]}",
      imagePart,
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Could not extract valid JSON from image");
  }

  async parsePrescriptionText(ocrResult, userId, doctorInfo = {}) {
    const medicines = ocrResult.medicines.map((med) => ({
      id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: med.name || "Unknown",
      dosage: med.dosage || "N/A",
      frequency: med.frequency || "N/A",
      duration: med.duration || "N/A",
      instruction: med.instruction || "N/A",
      status: "active",
      prescriptionId: null,
    }));

    const prescription = {
      id: `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      doctor: ocrResult.doctor || doctorInfo.name || "Unknown Doctor",
      specialty:
        ocrResult.specialty || doctorInfo.specialty || "General Medicine",
      date: ocrResult.date || new Date().toISOString(),
      status: "completed",
      userId: userId,
      medicines: medicines,
    };

    medicines.forEach((med) => {
      med.prescriptionId = prescription.id;
    });

    return prescription;
  }

  static async getJobStatus(jobId) {
    const job = await Job.fromId(prescriptionQueue, jobId);
    if (!job) return { status: "unknown" };
    const state = await job.getState();
    if (state === "completed") {
      return { status: "completed", result: await job.returnvalue };
    } else if (state === "failed") {
      return { status: "failed", error: job.failedReason };
    } else {
      return { status: state };
    }
  }
}

export default PrescriptionOCRProcessor;
