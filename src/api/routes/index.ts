import { Router } from "express";
import healthRoutes from "./health.routes.js";

const router = Router();

// Semua API routes akan didaftarkan di sini.
router.use("/health", healthRoutes);

export default router;