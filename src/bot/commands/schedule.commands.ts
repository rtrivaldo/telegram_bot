
import type { Telegraf } from "telegraf";

import { authService } from "../../services/auth.service.js";
import { scheduleService } from "../../services/schedule.service.js";

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function registerScheduleCommands(bot: Telegraf) {
    bot.command("jadwal", async (ctx) => {
        try {
            const telegramId = ctx.from.id;

            // 1. Memeriksa akun pengguna.
            const user = await authService.findUser(telegramId);

            if (!user || user.status !== "active") {
                return ctx.reply(
                    "Akun kamu belum aktif. Silakan hubungi administrator."
                );
            }

            // 2. Memastikan pengguna memiliki role sales.
            if (user.role !== "sales") {
                return ctx.reply(
                    "Fitur jadwal hanya tersedia untuk akun sales."
                );
            }

            // 3. Memastikan akun memiliki Salesforce Code.
            if (!user.salesforce_code) {
                return ctx.reply(
                    "Akun kamu belum memiliki kode Salesforce. Silakan hubungi administrator."
                );
            }

            // 4. Membaca argumen command.
            const commandText = ctx.message.text.trim();
            const args = commandText.split(/\s+/);

            const requestedDay = args[1];

            let day: string;

            if (requestedDay) {
                const normalizedDay =
                    scheduleService.normalizeDay(requestedDay);

                if (!normalizedDay) {
                    return ctx.reply(
                        [
                            "Format hari tidak valid.",
                            "",
                            "Contoh penggunaan:",
                            "/jadwal",
                            "/jadwal Senin",
                            "",
                            "Hari yang valid: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu",
                        ].join("\n")
                    );
                }

                day = normalizedDay;
            } else {
                day = scheduleService.getToday();
            }

            // 5. Mengambil jadwal dari database.
            const schedules = await scheduleService.getSchedule(
                user.salesforce_code,
                day
            );

            if (schedules.length === 0) {
                return ctx.reply(
                    [
                        `Tidak ada jadwal kunjungan pada hari ${capitalize(day)}.`,
                        "",
                        `Salesforce: ${user.salesforce_code}`,
                    ].join("\n")
                );
            }

            // 6. Membuat daftar outlet.
            const outletList = schedules.map((outlet, index) => {
                return [
                    `${index + 1}. ${outlet.outlet_name}`,
                    `   Outlet ID: ${outlet.outlet_id}`,
                    `   No. RS: ${outlet.no_rs}`,
                ].join("\n");
            });

            // 7. Mengirim hasil ke Telegram.
            await ctx.reply(
                [
                    "JADWAL KUNJUNGAN OUTLET",
                    "",
                    `Hari: ${capitalize(day)}`,
                    `Salesforce: ${user.salesforce_code}`,
                    `Total outlet: ${schedules.length}`,
                    "",
                    ...outletList,
                ].join("\n")
            );
        } catch (error) {
            console.error(
                "Failed to retrieve outlet schedule:",
                error
            );

            await ctx.reply(
                "Terjadi kesalahan saat mengambil jadwal kunjungan."
            );
        }
    });
}
