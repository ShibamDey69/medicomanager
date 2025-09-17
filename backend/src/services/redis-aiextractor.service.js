import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync } from "fs";
import { readFile, unlink } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import fileType from "file-type";
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const execAsync = promisify(exec);

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

const prescriptionQueue = new Queue('prescription-ocr', { connection });

const worker = new Worker('prescription-ocr', async (job) => {
  const { imageBuffer, userId, doctorInfo } = job.data;
  const processor = new PrescriptionOCRProcessor(process.env.GEMINI_API_KEY, { useQueue: false });
  return await processor._processImageInternal(imageBuffer, userId, doctorInfo);
}, { connection });

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on('completed', (job, result) => {
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
      const type = await fileType.fromBuffer(buffer);
      if (!type) return false;
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      return validTypes.includes(type.mime);
    } catch (error) {
      return false;
    }
  }

  async compressImage(inputPath, outputPath) {
    try {
      await execAsync(`ffmpeg -i ${inputPath} -vf scale=800:-1 -q:v 2 ${outputPath}`);
      return outputPath;
    } catch (error) {
      throw new Error(`Compression failed: ${error.message}`);
    }
  }

  async processImageToPrescription(imageBuffer, userId, doctorInfo = {}) {
    if (this.useQueue) {
      const job = await prescriptionQueue.add('process-prescription', {
        imageBuffer,
        userId,
        doctorInfo
      }, {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      });
      return { jobId: job.id, status: 'queued' };
    } else {
      return await this._processImageInternal(imageBuffer, userId, doctorInfo);
    }
  }

  async _processImageInternal(imageBuffer, userId, doctorInfo = {}) {
    try {
      const isValid = await this.validateImage(imageBuffer);
      if (!isValid) {
        throw new Error("Invalid image format");
      }

      const tempInput = `/tmp/input_${Date.now()}.jpg`;
      const tempCompressed = `/tmp/compressed_${Date.now()}.jpg`;
      
      writeFileSync(tempInput, imageBuffer);
      await this.compressImage(tempInput, tempCompressed);
      const compressedBuffer = await readFile(tempCompressed);
      
      const result = await this.extractTextFromImage(compressedBuffer);
      const prescriptionData = await this.parsePrescriptionText(result, userId, doctorInfo);
      
      await unlink(tempInput);
      await unlink(tempCompressed);
      
      return prescriptionData;
    } catch (error) {
      throw new Error(`Processing failed: ${error.message}`);
    }
  }

  async extractTextFromImage(imageBuffer) {
    try {
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg"
        }
      };

      const result = await this.model.generateContent([
        "Extract all prescription information from this image. Include doctor name, specialty, date, and all medicines with their details (name, dosage, frequency, duration, instructions). Return ONLY valid JSON with this structure: {doctor: string, specialty: string, date: ISODateString, medicines: [{name: string, dosage: string, frequency: string, duration: string, instruction: string}]}",
        imagePart
      ]);

      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error("Could not extract valid JSON from image");
    } catch (error) {
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  async parsePrescriptionText(ocrResult, userId, doctorInfo = {}) {
    try {
      const medicines = ocrResult.medicines.map(med => ({
        id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: med.name || 'Unknown',
        dosage: med.dosage || 'N/A',
        frequency: med.frequency || 'N/A',
        duration: med.duration || 'N/A',
        instruction: med.instruction || 'N/A',
        status: 'active',
        prescriptionId: null
      }));

      const prescription = {
        id: `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        doctor: ocrResult.doctor || doctorInfo.name || 'Unknown Doctor',
        specialty: ocrResult.specialty || doctorInfo.specialty || 'General Medicine',
        date: ocrResult.date || new Date().toISOString(),
        status: 'completed',
        userId: userId,
        medicines: medicines
      };

      medicines.forEach(med => {
        med.prescriptionId = prescription.id;
      });

      return prescription;
    } catch (error) {
      throw new Error(`Prescription parsing failed: ${error.message}`);
    }
  }

  static async getJobStatus(jobId) {
    const job = await Job.fromId(prescriptionQueue, jobId);
    if (!job) return { status: 'unknown' };
    const state = await job.getState();
    if (state === 'completed') {
      return { status: 'completed', result: await job.returnvalue };
    } else if (state === 'failed') {
      return { status: 'failed', error: job.failedReason };
    } else {
      return { status: state };
    }
  }
}

export default PrescriptionOCRProcessor;