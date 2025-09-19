import { Router } from "express";
import AIController from "../controllers/ai.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
const router = Router();
const aiController = new AIController();

router.post("/ask/:userId", authenticate, aiController.askQuestion.bind(aiController));
router.get("/answer/:jobId", authenticate, aiController.getAnswer.bind(aiController));
export default router;