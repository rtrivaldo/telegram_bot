import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "./database.js";

const migrationsDirectory = path.resolve(
    process.cwd(),
    "database/migrations",
);

export async function migrateDatabase(): Promise<void> {
    const client = await db.connect();

    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id BIGSERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        const files = (await readdir(migrationsDirectory))
            .filter((file) => file.endsWith(".sql"))
            .sort();

        console.log("Migration directory:", migrationsDirectory);
        console.log("Migration files found:", files);

        for (const filename of files) {
            const existing = await client.query(
                `SELECT filename
                 FROM schema_migrations
                 WHERE filename = $1`,
                [filename],
            );

            if ((existing.rowCount ?? 0) > 0) {
                console.log(`Migration already applied: ${filename}`);
                continue;
            }

            console.log(`Running migration: ${filename}`);

            await client.query("BEGIN");

            try {
                const filePath = path.join(
                    migrationsDirectory,
                    filename,
                );

                const sql = await readFile(filePath, "utf-8");

                await client.query(sql);

                await client.query(
                    `INSERT INTO schema_migrations (filename)
                     VALUES ($1)`,
                    [filename],
                );

                await client.query("COMMIT");

                console.log(`Migration applied: ${filename}`);
            } catch (error) {
                await client.query("ROLLBACK");

                console.error(`Migration failed: ${filename}`);
                throw error;
            }
        }

        console.log("Database migration completed.");
    } catch (error) {
        console.error("Failed to migrate database:", error);
        throw error;
    } finally {
        client.release();
    }
}