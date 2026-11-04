
import type { Scenes, Telegraf } from "telegraf";

import { authService } from "../../services/auth.service.js";
import { scheduleService } from "../../services/schedule.service.js";
import type { OutletSchedule } from "../../repositories/schedule.repository.js";

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function getCommandArgs(text: string): string[] {
    return text.trim().split(/\s+/).slice(1);
}

function formatSalesSchedules(
    schedules: OutletSchedule[],
): string {
    const grouped = new Map<number, OutletSchedule[]>();

    for (const schedule of schedules) {
        const existing = grouped.get(schedule.telegram_id) ?? [];
        existing.push(schedule);
        grouped.set(schedule.telegram_id, existing);
    }

    const messages: string[] = [];

    for (const salesSchedules of grouped.values()) {
        const sales = salesSchedules[0]!;

        const outletList = salesSchedules.map((schedule, index) =>
            [
                `${index + 1}. ${schedule.outlet_name}`,
                `   Outlet ID: ${schedule.outlet_id}`,
                `   No. RS: ${schedule.no_rs}`,
                `   Hari: ${capitalize(schedule.day.trim().toLowerCase())}`,
            ].join("\n"),
        );

        messages.push(
            [
                "",
                `SALES: ${sales.sales_name}`,
                `Telegram ID: ${sales.telegram_id}`,
                `Salesforce: ${sales.salesforce_code ?? "-"}`,
                "",
                ...outletList,
            ].join("\n"),
        );
    }

    return messages.join("\n\n--------------------\n\n");
}

export function registerScheduleCommands(bot: Telegraf<Scenes.WizardContext>): void {

    // ==========================================
    // SALES COMMAND
    // ==========================================

    bot.command("jadwal", async (ctx) => {
        try {
            const telegramId = ctx.from.id;

            const user = await authService.findUser(telegramId);

            if (!user || user.status !== "active") {
                return ctx.reply(
                    "Akun kamu belum aktif. Silakan hubungi administrator.",
                );
            }

            if (user.role !== "sales") {
                return ctx.reply(
                    "Fitur jadwal pribadi hanya tersedia untuk akun sales.",
                );
            }

            if (!user.salesforce_code) {
                return ctx.reply(
                    "Akun kamu belum memiliki kode Salesforce. Silakan hubungi administrator.",
                );
            }

            const args = getCommandArgs(ctx.message.text);
            const requestedDay = args[0];

            let day: string;

            if (requestedDay) {
                const normalizedDay =
                    scheduleService.normalizeDay(requestedDay);

                if (!normalizedDay) {
                    return ctx.reply(
                        [
                            "Format hari tidak valid.",
                            "",
                            "Contoh:",
                            "/jadwal",
                            "/jadwal Senin",
                        ].join("\n"),
                    );
                }

                day = normalizedDay;
            } else {
                day = scheduleService.getToday();
            }

            const schedules = await scheduleService.getSchedule(
                user.salesforce_code,
                day,
            );

            if (schedules.length === 0) {
                return ctx.reply(
                    [
                        `Tidak ada jadwal kunjungan pada hari ${capitalize(day)}.`,
                        "",
                        `Salesforce: ${user.salesforce_code}`,
                    ].join("\n"),
                );
            }

            const outletList = schedules.map((outlet, index) => [
                `${index + 1}. ${outlet.outlet_name}`,
                `   Outlet ID: ${outlet.outlet_id}`,
                `   No. RS: ${outlet.no_rs}`,
            ].join("\n"));

            return ctx.reply(
                [
                    "JADWAL KUNJUNGAN OUTLET",
                    "",
                    `Hari: ${capitalize(day)}`,
                    `Salesforce: ${user.salesforce_code}`,
                    `Total outlet: ${schedules.length}`,
                    "",
                    ...outletList,
                ].join("\n"),
            );
        } catch (error) {
            console.error("Failed to retrieve outlet schedule:", error);

            return ctx.reply(
                "Terjadi kesalahan saat mengambil jadwal kunjungan.",
            );
        }
    });

    // ==========================================
    // ADMIN & SUPERVISOR COMMAND
    // ==========================================

    // Melihat jadwal seluruh sales.
    bot.command("jadwalsales", async (ctx) => {
        try {
            const user = await authService.findUser(ctx.from.id);

            if (
                !user ||
                user.status !== "active" ||
                !["admin", "supervisor"].includes(user.role ?? "")
            ) {
                return ctx.reply(
                    "Akses ditolak. Khusus admin dan supervisor.",
                );
            }

            const args = getCommandArgs(ctx.message.text);

            let telegramId: number | undefined;
            let day: string | undefined;

            if (args.length > 2) {
                return ctx.reply(
                    [
                        "Format penggunaan:",
                        "/jadwalsales",
                        "/jadwalsales Jumat",
                        "/jadwalsales TELEGRAM_ID",
                        "/jadwalsales TELEGRAM_ID Jumat",
                    ].join("\n"),
                );
            }

            if (args.length > 0) {
                const firstArg = args[0]!;

                if (/^\d+$/.test(firstArg)) {
                    telegramId = Number(firstArg);

                    if (!Number.isSafeInteger(telegramId) || telegramId <= 0) {
                        return ctx.reply("Telegram ID tidak valid.");
                    }

                    if (args[1]) {
                        const normalizedDay =
                            scheduleService.normalizeDay(args[1]);

                        if (!normalizedDay) {
                            return ctx.reply("Nama hari tidak valid.");
                        }

                        day = normalizedDay;
                    }
                } else {
                    const normalizedDay =
                        scheduleService.normalizeDay(firstArg);

                    if (!normalizedDay) {
                        return ctx.reply(
                            "Format tidak valid. Gunakan nama hari atau Telegram ID.",
                        );
                    }

                    day = normalizedDay;
                }
            }

            const schedules = telegramId
                ? await scheduleService.getSchedulesByTelegramId(
                    telegramId,
                    day,
                )
                : await scheduleService.getAllSchedules(day);

            if (schedules.length === 0) {
                return ctx.reply(
                    "Tidak ditemukan jadwal kunjungan sesuai filter tersebut.",
                );
            }

            const title = [
                "JADWAL KUNJUNGAN SALES",
                "",
                `Filter hari: ${day ? capitalize(day) : "Semua hari"}`,
                `Filter sales: ${telegramId ?? "Semua sales"}`,
                `Total jadwal: ${schedules.length}`,
                `Total sales: ${new Set(schedules.map(item => item.telegram_id)).size}`,
                "",
            ].join("\n");

            const result = title + formatSalesSchedules(schedules);

            // Telegram membatasi panjang satu pesan sekitar 4096 karakter.
            if (result.length > 4000) {
                return ctx.reply(
                    "Data jadwal terlalu banyak untuk ditampilkan dalam satu pesan. Silakan gunakan filter hari atau Telegram ID.",
                );
            }

            return ctx.reply(result);
        } catch (error) {
            console.error("Failed to retrieve sales schedules:", error);

            return ctx.reply(
                "Terjadi kesalahan saat mengambil jadwal seluruh sales.",
            );
        }
    });
}
