import { db } from "../../src/config/database.js";

const admins = [
    {
        telegramId: 871331604,
        username: "rtrivaldo05",
        firstName: "Rivaldo",
        lastName: "Tandoko",
        role: "admin",
        status: "active",
        salesforceCode: "SF-TIMIKA-1-PALDO",
    },
];

async function seedAdmins() {
    try {
        console.log("Seeding admin users...");

        for (const admin of admins) {
            if (!Number.isSafeInteger(admin.telegramId)) {
                throw new Error(`Invalid Telegram ID: ${admin.telegramId}`);
            }

            await db.query(
                `
                INSERT INTO users (
                    telegram_id,
                    username,
                    first_name,
                    last_name,
                    role,
                    status,
                    salesforce_code
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (telegram_id)
                DO UPDATE SET
                    username = EXCLUDED.username,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    role = EXCLUDED.role,
                    status = EXCLUDED.status,
                    salesforce_code = EXCLUDED.salesforce_code,
                    updated_at = NOW()
                `,
                [
                    admin.telegramId,
                    admin.username,
                    admin.firstName,
                    admin.lastName,
                    admin.role,
                    admin.status,
                    admin.salesforceCode,
                ]
            );

            console.log(`Admin seeded: ${admin.telegramId}`);
        }

        console.log("Admin seeding completed.");
    } catch (error) {
        console.error("Failed to seed admins:", error);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

seedAdmins();