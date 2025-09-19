import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { xss } from "express-xss-sanitizer";
import hpp from "hpp";
import compression from "compression";
import morgan from "morgan";
import logger from "./utils/logger.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
import userRoutes from "./routes/user.routes.js";
import prescriptionRoutes from "./routes/prescription.routes.js";
import medicineRoutes from "./routes/medicine.routes.js";
import aichatRoutes from "./routes/aichat.routes.js";
const app = express();

app.use(helmet());
console.log(process.env.FRONTEND_URL);
app.use(
  cors({
    origin:  [process.env.FRONTEND_URL || "http://localhost:3000"],
    credentials: true,
  })
);
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
});
app.use(xss());
app.use(hpp());
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  handler: (req, res, next) => {
    res.status(429).json({
      success: false,
      error: "Rate limit exceeded",
      message:
        "You can only make 5 requests every 15 minutes. Please wait before trying again.",
    });
  },
});
app.use("/api", limiter);
app.use("/api/users", userRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/ai", aichatRoutes);
app.get("/", (req, res) => {
  logger.info("loll");
  res.status(200).send("All ok");
});

export default app;
