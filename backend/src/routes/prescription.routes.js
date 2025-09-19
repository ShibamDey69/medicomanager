import { Router } from "express";
import Prescription from "../controllers/prescription.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";


const router = Router();
const prescriptionController = new Prescription();

router.post("/user/:userId",authenticate, prescriptionController.create);
router.get("/user/:userId",authenticate, prescriptionController.getAllByUser);
router.get("/:id",authenticate, prescriptionController.getById);
router.put("/:id",authenticate, prescriptionController.update);
router.delete("/:id",authenticate, prescriptionController.delete);
router.post("/extract/:userId",authenticate, upload.single('image'), prescriptionController.extractFromImage);
router.get("/extract/status/:jobId",authenticate, prescriptionController.getExtractionStatus);
export default router;