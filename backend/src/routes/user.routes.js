import { Router } from "express";
import User from "../controllers/user.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const router = Router();
const userController = new User();

router.post("/login", userController.login);
router.get("/:id",authenticate, userController.getUser);
router.post("/:id",authenticate, userController.createUser);
router.put("/:id",authenticate, userController.updateUser);

export default router;