import { Client } from "pg";
import { env } from "./env.js";

function quoteIdentifier(identifier: string): string {
    return `"${identifier.replaceAll('"', '""')}"`;
}

export async function initializeDatabase(): Promise<void> {
    const client = new Client({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: "postgres",
    });

    try {
        await client.connect();

        const result = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [env.DB_NAME],
        );

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

    console.log("Database initialization completed.");
}