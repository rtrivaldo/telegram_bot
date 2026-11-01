import { Router } from "express";
import { botStatus } from "../../bot/bot.js";

const router = Router();

router.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        services: {
            api: {
                status: "running",
            },
            telegramBot: {
                status: botStatus.running ? "running" : "stopped",
            },
        },
    });
});

export default router;