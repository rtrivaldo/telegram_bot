
import { db } from "../../config/database.js";

const admins = [
    {
        telegramId: 871331604, // Ganti dengan Telegram ID admin pertama
        firstName: "Admin",
        lastName: "Utama",
        username: "username_admin",
    },
    // Tambahkan admin lainnya di sini
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
            status
          )
          VALUES ($1, $2, $3, $4, 'admin', 'active')
          ON CONFLICT (telegram_id)
          DO UPDATE SET
            username = EXCLUDED.username,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            role = 'admin',
            status = 'active',
            updated_at = NOW()
        `,
                [
                    admin.telegramId,
                    admin.username,
                    admin.firstName,
                    admin.lastName,
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
