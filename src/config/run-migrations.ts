import { db } from "./database.js";
import { migrateDatabase } from "./migrate-database.js";

async function main() {
    try {
        await migrateDatabase();
    } catch (error) {
        console.error("Migration process failed:", error);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

main();