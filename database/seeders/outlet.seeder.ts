
import { db } from "../../src/config/database.js";

const outlets = [
    {
        outletId: "4301060613",
        noRs: "82199777237",
        outletName: "Zufran Cell",
    },
    {
        outletId: "4300014480",
        noRs: "81248368415",
        outletName: "MELAN CELL",
    },
    {
        outletId: "4301047328",
        noRs: "82358878543",
        outletName: "RUSDI CELL",
    },
    {
        outletId: "4301022544",
        noRs: "81247805429",
        outletName: "NURUL CELL",
    },
    {
        outletId: "4301042635",
        noRs: "81248699262",
        outletName: "Alya kasyh",
    },
    {
        outletId: "4301026555",
        noRs: "81292853345",
        outletName: "ANA CELL",
    },
    {
        outletId: "4301036558",
        noRs: "82278260328",
        outletName: "CAHAYA CELL",
    },
    {
        outletId: "6001001666",
        noRs: "82197807621",
        outletName: "SYENI CELL",
    },
    {
        outletId: "4300014205",
        noRs: "82198654419",
        outletName: "NUNU CELL",
    },
    {
        outletId: "4301021641",
        noRs: "82310398001",
        outletName: "RAHMAT RAYEN CELL",
    },
    {
        outletId: "4301068385",
        noRs: "81248668529",
        outletName: "IMMA CELL 2",
    },
    {
        outletId: "4301001539",
        noRs: "82239473925",
        outletName: "82239473925-LIANA",
    },
    {
        outletId: "4300014332",
        noRs: "81344640887",
        outletName: "ASDA CELL",
    },
    {
        outletId: "4301015016",
        noRs: "81247460951",
        outletName: "ALVIRA CELL",
    },
    {
        outletId: "4301023237",
        noRs: "81343214355",
        outletName: "FIRMAN CELL",
    },
    {
        outletId: "4300014585",
        noRs: "82198513694",
        outletName: "PUTRI CELL(KILO 10)",
    },
    {
        outletId: "4301059137",
        noRs: "82399477773",
        outletName: "Natalia Desiana",
    },
    {
        outletId: "6001001998",
        noRs: "81248772842",
        outletName: "NURJATIM CELL",
    },
    {
        outletId: "4301014596",
        noRs: "82195055666",
        outletName: "MJ COLECCTION 2",
    },
    {
        outletId: "4301051773",
        noRs: "82257724474",
        outletName: "Gege cell",
    },
    {
        outletId: "4301055096",
        noRs: "82199778458",
        outletName: "Putra Kembar",
    },
    {
        outletId: "4301062259",
        noRs: "85215967125",
        outletName: "Fery irawan",
    },
    {
        outletId: "4301077224",
        noRs: "81354115011",
        outletName: "BERKAT CELL",
    },
    {
        outletId: "4301067242",
        noRs: "81238102125",
        outletName: "Ilhamcell",
    },
    {
        outletId: "4301002782",
        noRs: "82199137400",
        outletName: "Nur Aisya cell",
    },
    {
        outletId: "4301069523",
        noRs: "82124732990",
        outletName: "Kios wahyu",
    },
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
