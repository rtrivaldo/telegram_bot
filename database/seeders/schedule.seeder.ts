
import { db } from "../../src/config/database.js";

const schedules = [
    {
        outletId: "4300014332",
        noRs: "81344640887",
        outletName: "ASDA CELL",
        day: "Jumat",
        salesforceCode: "SF-TIMIKA-1-PALDO",
    },
];

async function seedSchedules() {
    const client = await db.connect();

    try {
        console.log("Seeding outlet schedules...");

        await client.query("BEGIN");

        for (const schedule of schedules) {
            // Find or create outlet
            const outletResult = await client.query(
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
                ],
            );

            const outletId = outletResult.rows[0].id;

            // Find sales user
            const userResult = await client.query(
                `
                SELECT id
                FROM users
                WHERE salesforce_code = $1
                LIMIT 1
                `,
                [schedule.salesforceCode],
            );

            if (userResult.rowCount === 0) {
                throw new Error(
                    `Sales user not found: ${schedule.salesforceCode}`,
                );
            }

            const userId = userResult.rows[0].id;

            // Insert schedule
            await client.query(
                `
                INSERT INTO outlet_visit_schedules (
                    user_id,
                    outlet_id,
                    day
                )
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, outlet_id, day)
                DO NOTHING
                `,
                [userId, outletId, schedule.day.toLowerCase()],
            );

            console.log(
                `Schedule seeded: ${schedule.outletName}`,
            );
        }

        await client.query("COMMIT");

        console.log("Schedule seeding completed.");
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Failed to seed schedules:", error);
        process.exitCode = 1;
    } finally {
        client.release();
        await db.end();
    }
}

seedSchedules();
