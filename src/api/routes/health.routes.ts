import { Router } from "express";

const router = Router();

// Endpoint untuk memeriksa apakah API berjalan.
router.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API is running",
        timestamp: new Date().toISOString(),
    });
});

export default router;