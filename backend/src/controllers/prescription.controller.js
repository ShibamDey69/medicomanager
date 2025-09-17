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
      if (!prescriptions || prescriptions.length === 0)
        return new Response(res, HTTP_ERROR_CODES.NOT_FOUND);

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

      const imageBuffer = req.file.buffer;
      const doctorInfo = req.body.doctorInfo
        ? JSON.parse(req.body.doctorInfo)
        : {};

      const processor = new PrescriptionOCRProcessor(
        process.env.GEMINI_API_KEY,
        { useQueue: true }
      );
      const result = await processor.processImageToPrescription(
        imageBuffer,
        userId,
        doctorInfo
      );

      if (result.jobId) {
        return new Response(res, SUCCESS_CODES.ACCEPTED, {
          message: "OCR processing started",
          jobId: result.jobId,
          status: result.status,
        });
      }

      return new Response(res, SUCCESS_CODES.CREATED, result);
    } catch (error) {
      console.log("OCR Extraction Error:", error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message || "OCR processing failed"
      );
    }
  }

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

      if (jobStatus.status === "unknown") {
        return new Response(res, HTTP_ERROR_CODES.NOT_FOUND, "Job not found");
      }

      if (jobStatus.status === "completed") {
        return new Response(res, SUCCESS_CODES.OK, {
          status: "completed",
          result: jobStatus.result,
        });
      }

      if (jobStatus.status === "failed") {
        return new Response(res, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR, {
          status: "failed",
          error: jobStatus.error,
        });
      }

      return new Response(res, SUCCESS_CODES.OK, {
        status: jobStatus.status,
        message: `Job is ${jobStatus.status}`,
      });
    } catch (error) {
      console.log("Job Status Error:", error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message || "Failed to retrieve job status"
      );
    }
  }
}

export default Prescription;
