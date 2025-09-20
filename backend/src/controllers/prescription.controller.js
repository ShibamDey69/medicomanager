import {
  createPrescription,
  getUserPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
} from "../services/prescription.service.js";
import PrescriptionOCRProcessor from "../services/redis-aiextractor.service.js";
import { SUCCESS_CODES, HTTP_ERROR_CODES } from "../constants/index.js";
import Response from "../handlers/responseHandler.js";

class Prescription {
  constructor() {}

  async create(req, res) {
    try {
      const userId = req.params.userId;
      if (!userId) return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      const data = req.body;
      if (!data || Object.keys(data).length === 0)
        return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      if (!data.doctor || !data.specialty || !data.date || !data.medicines) {
        return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);
      }

      const prescription = await createPrescription(userId, data);
      if (!prescription)
        return new Response(res, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR);

      return new Response(res, SUCCESS_CODES.CREATED, prescription);
    } catch (error) {
      console.log("lole", error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getAllByUser(req, res) {
    try {
      const userId = req.params.userId;
      if (!userId) return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      const prescriptions = await getUserPrescriptions(userId);

      return new Response(res, SUCCESS_CODES.OK, prescriptions);
    } catch (error) {
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getById(req, res) {
    try {
      const id = req.params.id;
      if (!id) return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      const prescription = await getPrescriptionById(id);
      if (!prescription) return new Response(res, HTTP_ERROR_CODES.NOT_FOUND);

      return new Response(res, SUCCESS_CODES.OK, prescription);
    } catch (error) {
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async update(req, res) {
    try {
      const id = req.params.id;
      if (!id) return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      const data = req.body;
      if (!data || Object.keys(data).length === 0)
        return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      const updated = await updatePrescription(id, data);
      if (!updated) return new Response(res, HTTP_ERROR_CODES.NOT_FOUND);

      return new Response(res, SUCCESS_CODES.OK, updated);
    } catch (error) {
      console.log("lole", error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async delete(req, res) {
    try {
      const id = req.params.id;
      if (!id) return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      const deleted = await deletePrescription(id);
      if (!deleted) return new Response(res, HTTP_ERROR_CODES.NOT_FOUND);

      return new Response(res, SUCCESS_CODES.OK, deleted);
    } catch (error) {
      console.log("lole", error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async extractFromImage(req, res) {
    const startTime = Date.now();

    try {

      const userId = req.params.userId;
      if (!userId) {
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "User ID is required"
        );
      }

      if (!req.file) {
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "Image file is required"
        );
      }

      if (req.file.size > 10 * 1024 * 1024) {
        console.log(`File too large: ${req.file.size} bytes`);
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "Image file too large (max 10MB)"
        );
      }

      const imageBuffer = req.file.buffer;
      let doctorInfo = {};

      if (req.body.doctorInfo) {
        try {
          doctorInfo = JSON.parse(req.body.doctorInfo);
        } catch (error) {
          console.warn("Invalid doctor info JSON:", error.message);
        }
      }

      const processor = new PrescriptionOCRProcessor(
        process.env.GOOGLE_API_KEY,
        { useQueue: true } 
      );

      const result = await processor.processImageToPrescription(
        imageBuffer,
        userId,
        doctorInfo
      );

      const processingTime = Date.now() - startTime;
  
      if (result.jobId) {
        return new Response(res, SUCCESS_CODES.ACCEPTED, {
          message: result.message || "OCR processing started",
          jobId: result.jobId,
          status: result.status,
          estimatedTime: "30-60 seconds",
          processingTime: `${processingTime}ms`,
        });
      } else {
        return new Response(res, SUCCESS_CODES.CREATED, {
          message: "OCR processing completed",
          result: result,
          processingTime: `${processingTime}ms`,
        });
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error("OCR Extraction Error:", {
        userId: req.params.userId,
        error: error.message,
        stack: error.stack,
        processingTime: `${processingTime}ms`,
      });
      if (error.message.includes("Invalid image")) {
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "Invalid image format. Please upload a valid JPEG, PNG, or WebP image."
        );
      }

      if (error.message.includes("API key")) {
        return new Response(
          res,
          HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
          "OCR service configuration error"
        );
      }

      if (error.message.includes("too large")) {
        return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST, error.message);
      }

      return new Response(res, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR, {
        message: "OCR processing failed",
        error: error.message,
        processingTime: `${processingTime}ms`,
      });
    }
  }

  /**
   * Get status of OCR processing job
   * GET /extract/status/:jobId
   */
  async getExtractionStatus(req, res) {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "Job ID is required"
        );
      }

      const jobStatus = await PrescriptionOCRProcessor.getJobStatus(jobId);

      switch (jobStatus.status) {
        case "unknown":
          console.log(
            `Job ${jobId} not found - may have been cleaned up or never existed`
          );
          return new Response(res, HTTP_ERROR_CODES.NOT_FOUND, {
            message: "Job not found",
            jobId: jobId,
            possibleReasons: [
              "Job ID is invalid",
              "Job has been cleaned up due to age",
              "Job was never created successfully",
            ],
          });

        case "completed":
          console.log(`Job ${jobId} completed successfully`);
          return new Response(res, SUCCESS_CODES.OK, {
            status: "completed",
            result: jobStatus.result,
            completedAt: jobStatus.completedAt,
            jobId: jobId,
          });

        case "failed":
          console.log(`Job ${jobId} failed:`, jobStatus.error);
          return new Response(res, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR, {
            status: "failed",
            error: jobStatus.error,
            failedAt: jobStatus.failedAt,
            attemptsMade: jobStatus.attemptsMade,
            jobId: jobId,
          });

        case "active":
          console.log(`Job ${jobId} is actively processing`);
          return new Response(res, SUCCESS_CODES.OK, {
            status: "active",
            message: "Job is currently being processed",
            progress: jobStatus.progress || 0,
            startedAt: jobStatus.startedAt,
            jobId: jobId,
            estimatedTimeRemaining: "30-45 seconds",
          });

        case "pending":
          console.log(`Job ${jobId} is pending in queue`);
          return new Response(res, SUCCESS_CODES.OK, {
            status: "pending",
            message: "Job is waiting to be processed",
            createdAt: jobStatus.createdAt,
            jobId: jobId,
            estimatedStartTime: "Within 30 seconds",
          });

        case "error":
          console.error(`Error checking job ${jobId}:`, jobStatus.error);
          return new Response(res, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR, {
            message: "Error checking job status",
            error: jobStatus.error,
            jobId: jobId,
          });

        default:
          console.log(`Job ${jobId} has status: ${jobStatus.status}`);
          return new Response(res, SUCCESS_CODES.OK, {
            status: jobStatus.status,
            message: jobStatus.message || `Job is ${jobStatus.status}`,
            jobId: jobId,
          });
      }
    } catch (error) {
      console.error("Job Status Check Error:", {
        jobId: req.params.jobId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      return new Response(res, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR, {
        message: "Failed to retrieve job status",
        error: error.message,
        jobId: req.params.jobId,
      });
    }
  }
}

export default Prescription;
