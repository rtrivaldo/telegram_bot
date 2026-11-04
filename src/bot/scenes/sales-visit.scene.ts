import { Scenes } from "telegraf";
import { userRepository } from "../../repositories/user.repository.js";
import { salesVisitService } from "../../services/sales-visit.service.js";
import { outletRepository } from "../../repositories/outlet.repository.js";

interface SalesVisitDraft {
    outletId?: string;
    periodWeek?: number;
    digiposBalance?: number;

    perdanaSa?: number[];
    vfData?: number[];
    vfVoice?: number[];

    activeCvm?: boolean;
    activeVoice?: boolean;
    activeDigital?: boolean;

    totalPurchase?: number;
}

type SalesVisitWizardContext = Scenes.WizardContext;

function parseAmount(value: string): number | null {
    const normalized = value.trim().replace(/\./g, "");

    if (!/^\d+$/.test(normalized)) {
        return null;
    }

    const amount = Number(normalized);

    return Number.isSafeInteger(amount) ? amount : null;
}

function formatAmount(value: number): string {
    return new Intl.NumberFormat("id-ID").format(value);
}

function parseProductValues(value: string): number[] | null {
    const parts = value.trim().split(/[\s,]+/);

    if (parts.length !== 3) {
        return null;
    }

    const values = parts.map((part) => {
        if (!/^\d+$/.test(part)) {
            return NaN;
        }

        return Number(part);
    });

    if (values.some((number) => !Number.isSafeInteger(number) || number < 0)) {
        return null;
    }

    return values;
}

function parseYesNo(value: string): boolean | null {
    const normalized = value.trim().toUpperCase();

    if (normalized === "Y") return true;
    if (normalized === "N") return false;

    return null;
}

function getDraft(ctx: SalesVisitWizardContext): SalesVisitDraft {
    return ctx.wizard.state as SalesVisitDraft;
}

export const salesVisitScene = new Scenes.WizardScene<SalesVisitWizardContext>(
    "sales-visit",

    // Step 1: Validasi akun dan minta Outlet ID
    async (ctx) => {
        if (!ctx.from) {
            await ctx.reply("Tidak dapat mengidentifikasi akun Telegram Anda.");
            return ctx.scene.leave();
        }

        const user = await userRepository.findByTelegramId(ctx.from.id);

        if (!user || user.status !== "active" || user.role !== "sales") {
            await ctx.reply(
                "Maaf, fitur Sales Visit hanya dapat digunakan oleh akun sales yang sudah aktif.",
            );
            return ctx.scene.leave();
        }

        await ctx.reply(
            "📝 *Laporan Sales Visit*\n\nMasukkan Outlet ID:",
            { parse_mode: "Markdown" },
        );

        return ctx.wizard.next();
    },

    // Step 2: Outlet ID
    async (ctx) => {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply("Silakan kirim Outlet ID dalam bentuk teks.");
            return;
        }

        const outletId = ctx.message.text.trim();

        if (!/^\d+$/.test(outletId)) {
            await ctx.reply("Outlet ID harus berupa angka. Silakan coba lagi.");
            return;
        }

        getDraft(ctx).outletId = outletId;

        await ctx.reply(
            "Pilih periode kunjungan:\n\nKirim angka 1 sampai 5.\nContoh: `1` untuk Minggu ke-1.",
            { parse_mode: "Markdown" },
        );

        return ctx.wizard.next();
    },

    // Step 3: Periode
    async (ctx) => {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply("Silakan kirim angka 1 sampai 5.");
            return;
        }

        const week = Number(ctx.message.text.trim());

        if (!Number.isInteger(week) || week < 1 || week > 5) {
            await ctx.reply("Periode tidak valid. Masukkan angka 1 sampai 5.");
            return;
        }

        getDraft(ctx).periodWeek = week;

        await ctx.reply("Masukkan Saldo Digipos.\nContoh: `1000000`", {
            parse_mode: "Markdown",
        });

        return ctx.wizard.next();
    },

    // Step 4: Saldo Digipos
    async (ctx) => {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply("Silakan kirim saldo dalam bentuk angka.");
            return;
        }

        const amount = parseAmount(ctx.message.text);

        if (amount === null) {
            await ctx.reply("Saldo tidak valid. Contoh input: `1000000`.");
            return;
        }

        getDraft(ctx).digiposBalance = amount;

        await ctx.reply(
            "Masukkan data *Perdana SA* dengan urutan:\n`Stok Selling Sellout`\n\nContoh: `1 2 3`",
            { parse_mode: "Markdown" },
        );

        return ctx.wizard.next();
    },

    // Step 5: Perdana SA
    async (ctx) => {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply("Kirim tiga angka dengan urutan Stok Selling Sellout.");
            return;
        }

        const values = parseProductValues(ctx.message.text);

        if (!values) {
            await ctx.reply("Format salah. Contoh yang benar: `1 2 3`.");
            return;
        }

        getDraft(ctx).perdanaSa = values;

        await ctx.reply(
            "Masukkan data *VF Data* dengan urutan:\n`Stok Selling Sellout`\n\nContoh: `1 2 3`",
            { parse_mode: "Markdown" },
        );

        return ctx.wizard.next();
    },

    // Step 6: VF Data
    async (ctx) => {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply("Kirim tiga angka dengan urutan Stok Selling Sellout.");
            return;
        }

        const values = parseProductValues(ctx.message.text);

        if (!values) {
            await ctx.reply("Format salah. Contoh yang benar: `1 2 3`.");
            return;
        }

        getDraft(ctx).vfData = values;

        await ctx.reply(
            "Masukkan data *VF Voice* dengan urutan:\n`Stok Selling Sellout`\n\nContoh: `1 2 3`",
            { parse_mode: "Markdown" },
        );

        return ctx.wizard.next();
    },

    // Step 7: VF Voice
    async (ctx) => {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply("Kirim tiga angka dengan urutan Stok Selling Sellout.");
            return;
        }

        const values = parseProductValues(ctx.message.text);

        if (!values) {
            await ctx.reply("Format salah. Contoh yang benar: `1 2 3`.");
            return;
        }

        getDraft(ctx).vfVoice = values;

        await ctx.reply("Apakah Outlet Aktif untuk CVM? Jawab Y atau N.");

        return ctx.wizard.next();
    },

    // Step 8: CVM
    async (ctx) => {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply("Jawab dengan Y atau N.");
            return;
        }

        const value = parseYesNo(ctx.message.text);

        if (value === null) {
            await ctx.reply("Jawaban tidak valid. Gunakan Y atau N.");
            return;
        }

        getDraft(ctx).activeCvm = value;

        await ctx.reply("Apakah Outlet Aktif untuk Voice? Jawab Y atau N.");

        return ctx.wizard.next();
    },

    // Step 9: Voice
    async (ctx) => {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply("Jawab dengan Y atau N.");
            return;
        }

        const value = parseYesNo(ctx.message.text);

        if (value === null) {
            await ctx.reply("Jawaban tidak valid. Gunakan Y atau N.");
            return;
        }

        getDraft(ctx).activeVoice = value;

        await ctx.reply("Apakah Outlet Aktif untuk Digital? Jawab Y atau N.");

        return ctx.wizard.next();
    },

    // Step 10: Digital
    async (ctx) => {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply("Jawab dengan Y atau N.");
            return;
        }

        const value = parseYesNo(ctx.message.text);

        if (value === null) {
            await ctx.reply("Jawaban tidak valid. Gunakan Y atau N.");
            return;
        }

        getDraft(ctx).activeDigital = value;

        await ctx.reply("Masukkan Total Belanja.\nContoh: `1884000`", {
            parse_mode: "Markdown",
        });

        return ctx.wizard.next();
    },

    // Step 11: Total Belanja dan tampilkan preview.
    async (ctx) => {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply("Silakan kirim total belanja dalam bentuk angka.");
            return;
        }

        const totalPurchase = parseAmount(ctx.message.text);

        if (totalPurchase === null) {
            await ctx.reply("Total belanja tidak valid. Contoh: `1884000`.", {
                parse_mode: "Markdown",
            });
            return;
        }

        const draft = getDraft(ctx);
        draft.totalPurchase = totalPurchase;

        try {
            const outlet = await outletRepository.findByOutletId(
                draft.outletId!
            );

            if (!outlet) {
                throw new Error(
                    `Outlet dengan ID ${draft.outletId} tidak ditemukan.`
                );
            }

            const formatProduct = (values: number[]) =>
                `Stok: ${values[0]}\n` +
                `Selling: ${values[1]}\n` +
                `Sellout: ${values[2]}`;

            const report = [
                "📋 RINGKASAN SALES VISIT",
                "",
                `Outlet ID: ${draft.outletId}`,
                `Nama Outlet: ${outlet.outlet_name}`,
                `Periode: Minggu ke-${draft.periodWeek}`,
                "",
                `Saldo Digipos: ${formatAmount(draft.digiposBalance!)}`,
                "",
                "Perdana SA",
                formatProduct(draft.perdanaSa!),
                "",
                "VF Data",
                formatProduct(draft.vfData!),
                "",
                "VF Voice",
                formatProduct(draft.vfVoice!),
                "",
                "Outlet Aktif",
                `CVM: ${draft.activeCvm ? "Y" : "N"}`,
                `Voice: ${draft.activeVoice ? "Y" : "N"}`,
                `Digital: ${draft.activeDigital ? "Y" : "N"}`,
                "",
                `Total Belanja: ${formatAmount(totalPurchase)}`,
                "",
                "Apakah data laporan sudah benar?",
                "",
                "Kirim /konfirmasi untuk menyimpan laporan.",
                "Kirim /batal untuk membatalkan laporan.",
            ].join("\n");

            await ctx.reply(report);

            return ctx.wizard.next();
        } catch (error) {
            console.error("Failed to generate sales visit preview:", error);

            const message =
                error instanceof Error
                    ? error.message
                    : "Terjadi kesalahan saat membuat preview.";

            await ctx.reply(`❌ ${message}`);

            return ctx.scene.leave();
        }
    },

    // Step 12: Konfirmasi dan simpan laporan.
    async (ctx) => {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply(
                "Kirim /konfirmasi untuk menyimpan laporan atau /batal untuk membatalkan."
            );
            return;
        }

        const command = ctx.message.text.trim().toLowerCase().split("@")[0];

        if (command !== "/konfirmasi") {
            await ctx.reply(
                "Perintah tidak dikenali.\n\n" +
                "Kirim /konfirmasi untuk menyimpan laporan.\n" +
                "Kirim /batal untuk membatalkan laporan."
            );
            return;
        }

        const draft = getDraft(ctx);

        try {
            if (!ctx.from) {
                throw new Error("Identitas Telegram tidak ditemukan.");
            }

            const salesVisit = await salesVisitService.create(ctx.from.id, {
                outletId: draft.outletId!,
                periodWeek: draft.periodWeek!,
                digiposBalance: draft.digiposBalance!,

                perdanaSaStock: draft.perdanaSa![0]!,
                perdanaSaSelling: draft.perdanaSa![1]!,
                perdanaSaSellout: draft.perdanaSa![2]!,

                vfDataStock: draft.vfData![0]!,
                vfDataSelling: draft.vfData![1]!,
                vfDataSellout: draft.vfData![2]!,

                vfVoiceStock: draft.vfVoice![0]!,
                vfVoiceSelling: draft.vfVoice![1]!,
                vfVoiceSellout: draft.vfVoice![2]!,

                activeCvm: draft.activeCvm!,
                activeVoice: draft.activeVoice!,
                activeDigital: draft.activeDigital!,

                totalPurchase: draft.totalPurchase!,
            });

            await ctx.reply(
                [
                    "✅ Laporan Sales Visit berhasil disimpan!",
                    "",
                    `ID Laporan: ${salesVisit.id}`,
                ].join("\n")
            );

        } catch (error) {
            console.error("Failed to save sales visit:", error);

            const message =
                error instanceof Error
                    ? error.message
                    : "Terjadi kesalahan saat menyimpan laporan.";

            await ctx.reply(
                `❌ ${message}\n\nSilakan coba /konfirmasi kembali atau /batal.`
            );

            return;
        }

        return ctx.scene.leave();
    },
);