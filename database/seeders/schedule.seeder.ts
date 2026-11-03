
import { db } from "../../src/config/database.js";

const schedules = [
    {
        outletId: "4300014332",
        noRs: "81344640887",
        outletName: "ASDA CELL",
        day: "Jumat",
        salesforceCode: "SF-TIMIKA-1-PALDO",
    },

    // Tambahkan outlet lainnya di sini.
];

async function seedSchedules() {
    try {
        console.log("Seeding outlet schedules...");

        for (const schedule of schedules) {
            // 1. Insert atau update outlet.
            const outletResult = await db.query(
                `
                INSERT INTO outlets (
                    outlet_id,
                    no_rs,
                    outlet_name
                )
                VALUES ($1, $2, $3)
                ON CONFLICT (outlet_id)
                DO UPDATE SET
                    no_rs = EXCLUDED.no_rs,
                    outlet_name = EXCLUDED.outlet_name,
                    updated_at = NOW()
                RETURNING id
                `,
                [
                    schedule.outletId,
                    schedule.noRs,
                    schedule.outletName,
                ]
            );

            const outletId = outletResult.rows[0].id;

            // 2. Cari sales berdasarkan Salesforce Code.
            const userResult = await db.query(
                `
                SELECT id
                FROM users
                WHERE salesforce_code = $1
                LIMIT 1
                `,
                [schedule.salesforceCode]
            );

            if (userResult.rowCount === 0) {
                throw new Error(
                    `Sales user not found: ${schedule.salesforceCode}`
                );
            }

            const userId = userResult.rows[0].id;

            // 3. Periksa apakah jadwal sudah tersedia.
            const existingSchedule = await db.query(
                `
                SELECT id
                FROM outlet_visit_schedules
                WHERE user_id = $1
                  AND outlet_id = $2
                  AND day = $3
                LIMIT 1
                `,
                [userId, outletId, schedule.day.toLowerCase()]
            );

            // 4. Insert jika jadwal belum tersedia.
            if (existingSchedule.rowCount === 0) {
                await db.query(
                    `
                    INSERT INTO outlet_visit_schedules (
                        user_id,
                        outlet_id,
                        day
                    )
                    VALUES ($1, $2, $3)
                    `,
                    [
                        userId,
                        outletId,
                        schedule.day.toLowerCase(),
                    ]
                );

                console.log(
                    `Schedule inserted: ${schedule.outletName}`
                );
            } else {
                console.log(
                    `Schedule already exists: ${schedule.outletName}`
                );
            }
        }

        console.log("Schedule seeding completed.");
    } catch (error) {
        console.error("Failed to seed schedules:", error);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

seedSchedules();
