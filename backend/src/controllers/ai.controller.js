import MedicalAssistantController from "../services/redis-aichat.service.js";
import { getUserProfile } from "../services/user.service.js";
import { getUserPrescriptions } from "../services/prescription.service.js";
import { SUCCESS_CODES, HTTP_ERROR_CODES } from "../constants/index.js";
import Response from "../handlers/responseHandler.js";
import { Queue } from "bullmq";

class AIController {
  constructor() {
    this.aiController = new MedicalAssistantController(process.env.GEMINI_API_KEY);
    this.queue = new Queue("medical-assistant", { connection: this.aiController.redis });
  }

  async askQuestion(req, res) {
    try {
      const userId = req.params.userId;
      const { question } = req.body;
      
      if (!userId) return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);
      if (!question) return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      const user = await getUserProfile(userId);
      if (!user) return new Response(res, HTTP_ERROR_CODES.NOT_FOUND);

      const prescriptions = await getUserPrescriptions(userId);

      const userData = {
        user: user,
        prescriptions: prescriptions
      };

      const jobId = await this.aiController.submitQuery(userData, question);
      
      return new Response(res, SUCCESS_CODES.ACCEPTED, {
        jobId: jobId,
        message: "Query submitted successfully. Check result using jobId."
      });
    } catch (error) {
      console.error('AI Question Error:', error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getAnswer(req, res) {
    try {
      const { jobId } = req.params;
      if (!jobId) return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      const result = await this.aiController.getQueryResult(jobId);
      
      if (!result) {
        return new Response(res, HTTP_ERROR_CODES.NOT_FOUND, "Job not found or expired");
      }

      if (result.status === "processing") {
        return new Response(res, SUCCESS_CODES.ACCEPTED, {
          status: "processing",
          message: "Query is still being processed"
        });
      }

      return new Response(res, SUCCESS_CODES.OK, result);
    } catch (error) {
      console.error('AI Get Answer Error:', error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async close() {
    if (this.aiController) {
      await this.aiController.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
  }
}

export default AIController;