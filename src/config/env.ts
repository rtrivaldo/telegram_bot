import "dotenv/config";
import { z } from "zod";

// Memvalidasi environment variable saat aplikasi dijalankan.
const envSchema = z.object({
    BOT_TOKEN: z.string().min(1),

    // Mendukung lebih dari satu administrator.
    ADMIN_IDS: z.string().default(""),

    DB_HOST: z.string().default("localhost"),
    DB_PORT: z.coerce.number().default(5432),
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string(),

    PORT: z.coerce.number().default(3000),
});

// Aplikasi akan gagal dijalankan jika konfigurasi tidak valid.
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment configuration:");
    console.error(parsedEnv.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsedEnv.data;