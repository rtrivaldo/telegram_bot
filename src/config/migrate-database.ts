import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./database.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const migrationsDirectory = path.resolve(
    currentDirectory,
    "../database/migrations"
);

export async function migrateDatabase() {
    const client = await db.connect();

    try {
        // Membuat tabel untuk mencatat migration yang sudah dijalankan.
        await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGSERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        // Membaca seluruh file SQL dan mengurutkannya.
        const files = (await readdir(migrationsDirectory))
            .filter((file) => file.endsWith(".sql"))
            .sort();

        for (const filename of files) {
            await client.query("BEGIN");

            try {
                // Periksa apakah migration sudah pernah dijalankan.
                const existing = await client.query(
                    `SELECT filename
           FROM schema_migrations
           WHERE filename = $1`,
                    [filename]
                );

                if ((existing.rowCount ?? 0) > 0) {
                    await client.query("COMMIT");
                    console.log(`Migration already applied: ${filename}`);
                    continue;
                }

                // Membaca dan menjalankan file SQL.
                const filePath = path.join(migrationsDirectory, filename);
                const sql = await readFile(filePath, "utf-8");

                await client.query(sql);

                // Catat migration setelah berhasil dijalankan.
                await client.query(
                    `INSERT INTO schema_migrations (filename)
           VALUES ($1)`,
                    [filename]
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