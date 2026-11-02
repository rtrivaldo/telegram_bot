
import { db } from "../config/database.js";

export interface Outlet {
    id: number;
    outlet_id: string;
    no_rs: string;
    outlet_name: string;
    created_at: Date;
    updated_at: Date;
}

interface OutletRow {
    id: string;
    outlet_id: string;
    no_rs: string;
    outlet_name: string;
    created_at: Date;
    updated_at: Date;
}

export interface CreateOutletInput {
    outlet_id: string;
    no_rs: string;
    outlet_name: string;
}

export interface UpdateOutletInput {
    outlet_id: string;
    no_rs: string;
    outlet_name: string;
}

function mapOutlet(row: OutletRow): Outlet {
    return {
        ...row,
        id: Number(row.id),
    };
}

class OutletRepository {
    async findAll(): Promise<Outlet[]> {
        const result = await db.query<OutletRow>(
            `
            SELECT *
            FROM outlets
            ORDER BY outlet_name ASC
            `,
        );

        return result.rows.map(mapOutlet);
    }

    async findById(id: number): Promise<Outlet | null> {
        const result = await db.query<OutletRow>(
            `
            SELECT *
            FROM outlets
            WHERE id = $1
            `,
            [id],
        );

        return result.rows[0]
            ? mapOutlet(result.rows[0])
            : null;
    }

    async findByOutletId(
        outletId: string,
    ): Promise<Outlet | null> {
        const result = await db.query<OutletRow>(
            `
            SELECT *
            FROM outlets
            WHERE outlet_id = $1
            `,
            [outletId],
        );

        return result.rows[0]
            ? mapOutlet(result.rows[0])
            : null;
    }

    async create(
        input: CreateOutletInput,
    ): Promise<Outlet> {
        const result = await db.query<OutletRow>(
            `
            INSERT INTO outlets (
                outlet_id,
                no_rs,
                outlet_name
            )
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [
                input.outlet_id,
                input.no_rs,
                input.outlet_name,
            ],
        );

        return mapOutlet(result.rows[0]!);
    }

    async update(
        id: number,
        input: UpdateOutletInput,
    ): Promise<Outlet | null> {
        const result = await db.query<OutletRow>(
            `
            UPDATE outlets
            SET
                outlet_id = $2,
                no_rs = $3,
                outlet_name = $4,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            `,
            [
                id,
                input.outlet_id,
                input.no_rs,
                input.outlet_name,
            ],
        );

        return result.rows[0]
            ? mapOutlet(result.rows[0])
            : null;
    }

    async delete(id: number): Promise<Outlet | null> {
        const result = await db.query<OutletRow>(
            `
            DELETE FROM outlets
            WHERE id = $1
            RETURNING *
            `,
            [id],
        );

        return result.rows[0]
            ? mapOutlet(result.rows[0])
            : null;
    }
}

export const outletRepository = new OutletRepository();
