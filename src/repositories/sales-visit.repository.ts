import { db } from "../config/database.js";

export interface CreateSalesVisitInput {
    userId: number;
    outletId: number;
    visitDate?: string;
    periodWeek: number;

    digiposBalance: number;

    perdanaSaStock: number;
    perdanaSaSelling: number;
    perdanaSaSellout: number;

    vfDataStock: number;
    vfDataSelling: number;
    vfDataSellout: number;

    vfVoiceStock: number;
    vfVoiceSelling: number;
    vfVoiceSellout: number;

    activeCvm: boolean;
    activeVoice: boolean;
    activeDigital: boolean;

    totalPurchase: number;
}

export interface SalesVisit {
    id: number;
    user_id: number;
    outlet_id: number;
    visit_date: string;
    period_week: number;

    digipos_balance: string;

    perdana_sa_stock: number;
    perdana_sa_selling: number;
    perdana_sa_sellout: number;

    vf_data_stock: number;
    vf_data_selling: number;
    vf_data_sellout: number;

    vf_voice_stock: number;
    vf_voice_selling: number;
    vf_voice_sellout: number;

    active_cvm: boolean;
    active_voice: boolean;
    active_digital: boolean;

    total_purchase: string;

    created_at: Date;
    updated_at: Date;
}

class SalesVisitRepository {
    async create(data: CreateSalesVisitInput): Promise<SalesVisit> {
        const result = await db.query<SalesVisit>(
            `
            INSERT INTO sales_visits (
                user_id,
                outlet_id,
                visit_date,
                period_week,
                digipos_balance,
                perdana_sa_stock,
                perdana_sa_selling,
                perdana_sa_sellout,
                vf_data_stock,
                vf_data_selling,
                vf_data_sellout,
                vf_voice_stock,
                vf_voice_selling,
                vf_voice_sellout,
                active_cvm,
                active_voice,
                active_digital,
                total_purchase
            )
            VALUES (
                $1, $2, COALESCE($3::DATE, CURRENT_DATE), $4,
                $5, $6, $7, $8, $9, $10, $11,
                $12, $13, $14, $15, $16, $17, $18
            )
            RETURNING *
            `,
            [
                data.userId,
                data.outletId,
                data.visitDate ?? null,
                data.periodWeek,
                data.digiposBalance,
                data.perdanaSaStock,
                data.perdanaSaSelling,
                data.perdanaSaSellout,
                data.vfDataStock,
                data.vfDataSelling,
                data.vfDataSellout,
                data.vfVoiceStock,
                data.vfVoiceSelling,
                data.vfVoiceSellout,
                data.activeCvm,
                data.activeVoice,
                data.activeDigital,
                data.totalPurchase,
            ],
        );

        const salesVisit = result.rows[0];

        if (!salesVisit) {
            throw new Error("Failed to create sales visit.");
        }

        return salesVisit;
    }

    async findById(id: number): Promise<SalesVisit | null> {
        const result = await db.query<SalesVisit>(
            `
            SELECT *
            FROM sales_visits
            WHERE id = $1
            LIMIT 1
            `,
            [id],
        );

        return result.rows[0] ?? null;
    }

    async findByUserId(userId: number): Promise<SalesVisit[]> {
        const result = await db.query<SalesVisit>(
            `
            SELECT *
            FROM sales_visits
            WHERE user_id = $1
            ORDER BY visit_date DESC, created_at DESC
            `,
            [userId],
        );

        return result.rows;
    }

    async findByOutletId(outletId: number): Promise<SalesVisit[]> {
        const result = await db.query<SalesVisit>(
            `
            SELECT *
            FROM sales_visits
            WHERE outlet_id = $1
            ORDER BY visit_date DESC, created_at DESC
            `,
            [outletId],
        );

        return result.rows;
    }
}

export const salesVisitRepository = new SalesVisitRepository();