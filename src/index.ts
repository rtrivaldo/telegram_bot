import { env } from "./config/env.js";
import { db } from "./config/database.js";
import { initializeDatabase } from "./config/init-database.js";
import app from "./api/app.js";
import { startBot, bot } from "./bot/bot.js";

async function startApplication(): Promise<void> {
    try {
        // Initialize database and tables
        await initializeDatabase();

        // Verify database connection
        await db.query("SELECT 1");

        console.log("Database connected successfully.");

        // Start Express server
        const server = app.listen(env.PORT, () => {
            console.log(`API running on port ${env.PORT}`);
        });

        // Start Telegram bot
        await startBot();

        console.log("Telegram bot started successfully.");

        // Graceful shutdown
        const shutdown = async () => {
            console.log("Shutting down application...");

            bot.stop("SIGTERM");

            server.close(async () => {
                await db.end();
                process.exit(0);
            });
        };

        process.once("SIGINT", shutdown);
        process.once("SIGTERM", shutdown);
    } catch (error) {
        console.error("Failed to start application:", error);
        await db.end();
        process.exit(1);
    }
}

startApplication();