import { Pool } from "pg";
import { env } from "./env.js";

// Membuat connection pool PostgreSQL.
export const db = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    max: 10,
});

// Menangani error koneksi yang tidak tertangani.
db.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error);
});