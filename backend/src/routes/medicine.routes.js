import { Router } from "express";
import Medicine from "../controllers/medicine.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const router = Router();
const medicineController = new Medicine();

router.post("/prescription/:prescriptionId",authenticate, medicineController.create);
router.get("/prescription/:prescriptionId",authenticate, medicineController.getAllByPrescription);
router.get("/user/:userId/active",authenticate, medicineController.getAllActiveMedicines);
router.put("/:id",authenticate, medicineController.update);
router.delete("/:id",authenticate, medicineController.delete);

export default router;
