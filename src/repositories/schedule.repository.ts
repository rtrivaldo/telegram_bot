
import type { QueryResultRow } from "pg";
import { db } from "../config/database.js";

export interface OutletSchedule extends QueryResultRow {
    id: number;
    outlet_id: string;
    no_rs: string;
    outlet_name: string;
    day: string;
    salesforce_code: string;
    created_at: Date;
    updated_at: Date;
}

class ScheduleRepository {
    async findBySalesforceAndDay(
        salesforceCode: string,
        day: string
    ): Promise<OutletSchedule[]> {
        const result = await db.query<OutletSchedule>(
            `
                SELECT
                    id,
                    outlet_id,
                    no_rs,
                    outlet_name,
                    day,
                    salesforce_code,
                    created_at,
                    updated_at
                FROM outlet_visit_schedules
                WHERE TRIM(LOWER(salesforce_code)) = TRIM(LOWER($1))
                    AND TRIM(LOWER(day)) = TRIM(LOWER($2))
                ORDER BY outlet_name ASC
            `,
            [salesforceCode, day]
        );

        return result.rows;
    }
}

export const scheduleRepository = new ScheduleRepository();
