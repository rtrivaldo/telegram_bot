import { Client } from "pg";
import { env } from "./env.js";
import { db } from "./database.js";

function quoteIdentifier(identifier: string): string {
    return `"${identifier.replaceAll('"', '""')}"`;
}

export async function initializeDatabase(): Promise<void> {
    // 1. Connect ke database bawaan PostgreSQL
    const client = new Client({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: "postgres",
    });

    try {
        await client.connect();

        // 2. Periksa apakah database sudah tersedia
        const result = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [env.DB_NAME],
        );

        // 3. Buat database jika belum tersedia
        if (result.rowCount === 0) {
            console.log(`Creating database: ${env.DB_NAME}`);

            await client.query(
                `CREATE DATABASE ${quoteIdentifier(env.DB_NAME)}`,
            );

            console.log("Database created successfully.");
        } else {
            console.log(`Database ${env.DB_NAME} already exists.`);
        }
    } finally {
        await client.end();
    }

    // 4. Buat tabel menggunakan koneksi database proyek
    await createTables();

    console.log("Database initialization completed.");
}

async function createTables(): Promise<void> {
    // Users table
    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,

            telegram_id BIGINT UNIQUE NOT NULL,
            username VARCHAR(255),
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255),

            role VARCHAR(20),
            status VARCHAR(20) NOT NULL DEFAULT 'pending',

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT users_role_check
                CHECK (
                    role IS NULL OR
                    role IN ('admin', 'sales', 'supervisor')
                ),

            CONSTRAINT users_status_check
                CHECK (
                    status IN (
                        'pending',
                        'active',
                        'rejected',
                        'disabled'
                    )
                )
        );
    `);

    // Index untuk mempercepat pencarian berdasarkan status
    await db.query(`
        CREATE INDEX IF NOT EXISTS idx_users_status
        ON users(status);
    `);

    // Index untuk pencarian berdasarkan role
    await db.query(`
        CREATE INDEX IF NOT EXISTS idx_users_role
        ON users(role);
    `);

    console.log("Tables and indexes created successfully.");
}