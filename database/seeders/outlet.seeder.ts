
import { db } from "../../src/config/database.js";

const outlets = [
    {
        outletId: "4300014332",
        noRs: "81344640887",
        outletName: "ASDA CELL",
    },

    // Tambahkan outlet lainnya di sini.
];

async function seedOutlets() {
    try {
        console.log("Seeding outlets...");

        for (const outlet of outlets) {
            await db.query(
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
                `,
                [
                    outlet.outletId,
                    outlet.noRs,
                    outlet.outletName,
                ]
            );

            console.log(`Outlet seeded: ${outlet.outletName}`);
        }

        console.log("Outlet seeding completed.");
    } catch (error) {
        console.error("Failed to seed outlets:", error);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

seedOutlets();
