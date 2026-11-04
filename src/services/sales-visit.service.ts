import { z } from "zod";

import { userRepository } from "../repositories/user.repository.js";
import { outletRepository } from "../repositories/outlet.repository.js";
import { salesVisitRepository } from "../repositories/sales-visit.repository.js";

// Validasi data laporan
const salesVisitSchema = z.object({
    outletId: z.string().trim().min(1, "Outlet ID wajib diisi."),

    periodWeek: z.number()
        .int()
        .min(1, "Periode minimal minggu ke-1.")
        .max(5, "Periode maksimal minggu ke-5."),

    digiposBalance: z.number().finite().int().nonnegative(),

    perdanaSaStock: z.number().int().nonnegative(),
    perdanaSaSelling: z.number().int().nonnegative(),
    perdanaSaSellout: z.number().int().nonnegative(),

    vfDataStock: z.number().int().nonnegative(),
    vfDataSelling: z.number().int().nonnegative(),
    vfDataSellout: z.number().int().nonnegative(),

    vfVoiceStock: z.number().int().nonnegative(),
    vfVoiceSelling: z.number().int().nonnegative(),
    vfVoiceSellout: z.number().int().nonnegative(),

    activeCvm: z.boolean(),
    activeVoice: z.boolean(),
    activeDigital: z.boolean(),

    totalPurchase: z.number().finite().int().nonnegative(),
});

export type SubmitSalesVisitInput = z.infer<typeof salesVisitSchema>;

class SalesVisitService {
    async create(
        telegramId: number,
        input: SubmitSalesVisitInput,
    ) {
        // 1. Validasi input
        const validation = salesVisitSchema.safeParse(input);

        if (!validation.success) {
            const messages = validation.error.issues
                .map((issue) => issue.message);

            throw new Error(messages.join(", "));
        }

        const data = validation.data;

        // 2. Cari pengguna berdasarkan Telegram ID
        const user = await userRepository.findByTelegramId(telegramId);

        if (!user) {
            throw new Error("Akun Telegram belum terdaftar.");
        }

        if (user.status !== "active") {
            throw new Error("Akun Anda belum aktif.");
        }

        if (user.role !== "sales") {
            throw new Error("Fitur ini hanya dapat digunakan oleh sales.");
        }

        // 3. Cari outlet berdasarkan Outlet ID
        const outlet = await outletRepository.findByOutletId(
            data.outletId,
        );

        if (!outlet) {
            throw new Error(
                `Outlet dengan ID ${data.outletId} tidak ditemukan.`,
            );
        }

        // 4. Simpan laporan
        const salesVisit = await salesVisitRepository.create({
            userId: user.id,
            outletId: outlet.id,

            periodWeek: data.periodWeek,

            digiposBalance: data.digiposBalance,

            perdanaSaStock: data.perdanaSaStock,
            perdanaSaSelling: data.perdanaSaSelling,
            perdanaSaSellout: data.perdanaSaSellout,

            vfDataStock: data.vfDataStock,
            vfDataSelling: data.vfDataSelling,
            vfDataSellout: data.vfDataSellout,

            vfVoiceStock: data.vfVoiceStock,
            vfVoiceSelling: data.vfVoiceSelling,
            vfVoiceSellout: data.vfVoiceSellout,

            activeCvm: data.activeCvm,
            activeVoice: data.activeVoice,
            activeDigital: data.activeDigital,

            totalPurchase: data.totalPurchase,
        });

        return salesVisit;
    }
}

export const salesVisitService = new SalesVisitService();