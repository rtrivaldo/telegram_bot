import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    BOT_TOKEN: z.string().min(1),

    DB_HOST: z.string().default("localhost"),
    DB_PORT: z.coerce.number().default(5432),
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string(),

    PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);