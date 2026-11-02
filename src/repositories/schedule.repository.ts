
import type { QueryResultRow } from "pg";
import { db } from "../config/database.js";

export interface OutletSchedule {
    id: number;
    user_id: number;
    telegram_id: number;
    sales_name: string;
    salesforce_code: string | null;
    outlet_id: string;
    no_rs: string;
    outlet_name: string;
    day: string;
    created_at: Date;
    updated_at: Date;
}

interface OutletScheduleRow extends QueryResultRow {
    id: string;
    user_id: string;
    telegram_id: string;
    sales_name: string;
    salesforce_code: string | null;
    outlet_id: string;
    no_rs: string;
    outlet_name: string;
    day: string;
    created_at: Date;
    updated_at: Date;
}

function mapSchedule(row: OutletScheduleRow): OutletSchedule {
    return {
        ...row,
        id: Number(row.id),
        user_id: Number(row.user_id),
        telegram_id: Number(row.telegram_id),
    };
}

class ScheduleRepository {
    private readonly baseQuery = `
        SELECT
            schedules.id,
            schedules.user_id,
            users.telegram_id,
            users.first_name ||
                COALESCE(' ' || users.last_name, '') AS sales_name,
            users.salesforce_code,
            outlets.outlet_id,
            outlets.no_rs,
            outlets.outlet_name,
            schedules.day,
            schedules.created_at,
            schedules.updated_at
        FROM outlet_visit_schedules schedules
        INNER JOIN users
            ON users.id = schedules.user_id
        INNER JOIN outlets
            ON outlets.id = schedules.outlet_id
    `;

    async findBySalesforceAndDay(
        salesforceCode: string,
        day: string,
    ): Promise<OutletSchedule[]> {
        const result = await db.query<OutletScheduleRow>(
            `
            ${this.baseQuery}
            WHERE TRIM(LOWER(users.salesforce_code)) = TRIM(LOWER($1))
              AND TRIM(LOWER(schedules.day)) = TRIM(LOWER($2))
            ORDER BY outlets.outlet_name ASC
            `,
            [salesforceCode, day],
        );

        return result.rows.map(mapSchedule);
    }

    async findAll(): Promise<OutletSchedule[]> {
        const result = await db.query<OutletScheduleRow>(
            `
            ${this.baseQuery}
            ORDER BY users.first_name ASC, schedules.day ASC,
                     outlets.outlet_name ASC
            `,
        );

        return result.rows.map(mapSchedule);
    }

    async findAllByDay(day: string): Promise<OutletSchedule[]> {
        const result = await db.query<OutletScheduleRow>(
            `
            ${this.baseQuery}
            WHERE TRIM(LOWER(schedules.day)) = TRIM(LOWER($1))
            ORDER BY users.first_name ASC, outlets.outlet_name ASC
            `,
            [day],
        );

        return result.rows.map(mapSchedule);
    }

    async findByTelegramId(
        telegramId: number,
        day?: string,
    ): Promise<OutletSchedule[]> {
        const result = await db.query<OutletScheduleRow>(
            `
            ${this.baseQuery}
            WHERE users.telegram_id = $1
              AND (
                  $2::varchar IS NULL
                  OR TRIM(LOWER(schedules.day)) = TRIM(LOWER($2))
              )
            ORDER BY schedules.day ASC, outlets.outlet_name ASC
            `,
            [telegramId, day ?? null],
        );

        return result.rows.map(mapSchedule);
    }
}

export const scheduleRepository = new ScheduleRepository();
