
import { db } from "../../src/config/database.js";

const schedules = [
    {
        outletId: "4300014332",
        noRs: "81344640887",
        outletName: "ASDA CELL",
        day: "Jumat",
        salesforceCode: "SF-TIMIKA-6-BRIAN",
    },
];

async function seedSchedules() {
    try {
        console.log("Seeding outlet schedules...");

        for (const schedule of schedules) {
            await db.query(
                `
                    INSERT INTO outlet_visit_schedules (
                        outlet_id,
                        no_rs,
                        outlet_name,
                        day,
                        salesforce_code
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT DO NOTHING
                `,
                [
                    schedule.outletId,
                    schedule.noRs,
                    schedule.outletName,
                    schedule.day,
                    schedule.salesforceCode,
                ]
            );

            console.log(
                `Schedule seeded: ${schedule.outletName}`
            );
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
