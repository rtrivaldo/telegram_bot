
import { Telegraf, Scenes, session } from "telegraf";
import { env } from "../config/env.js";

import { registerAuthCommands } from "./commands/auth.commands.js";
import { registerScheduleCommands } from "./commands/schedule.commands.js";
import { registerOutletCommands } from "./commands/outlet.commands.js";
import { salesVisitScene } from "./scenes/sales-visit.scene.js";

// Membuat instance Telegram Bot.
export const bot = new Telegraf<Scenes.WizardContext>(env.BOT_TOKEN);

// Status Telegram Bot.
export const botStatus = {
    running: false,
};

// Mendaftarkan session dan Wizard Scene.
const stage = new Scenes.Stage<Scenes.WizardContext>([
    salesVisitScene,
]);

bot.use(session());

// Middleware global untuk menangani pembatalan sebelum Wizard Scene.
bot.use(async (ctx, next) => {
    const message = ctx.message;

    if (
        message &&
        "text" in message &&
        /^\/batal(?:@\w+)?(?:\s|$)/i.test(message.text)
    ) {
        const sessionData = ctx.session as unknown as Record<string, unknown>;

        const sceneSession = sessionData.__scenes as
            | { current?: string }
            | undefined;

        if (sceneSession?.current === "sales-visit") {
            delete sessionData.__scenes;

            await ctx.reply("Pengisian Sales Visit berhasil dibatalkan.");
        } else {
            await ctx.reply("Tidak ada proses Sales Visit yang sedang berjalan.");
        }

        return;
    }

    await next();
});

bot.use(stage.middleware());

// Command test.
bot.command("test", async (ctx) => {
    console.log("TEST COMMAND RECEIVED:", ctx.message.text);

    await ctx.reply("Bot berhasil menerima command!");
});

// Memulai Telegram Bot.
export async function startBot() {
    try {
        await bot.launch(
            {},
            () => {
                botStatus.running = true;
                console.log("Telegram bot is running.");
            }
        );
    } catch (error) {
        botStatus.running = false;
        console.error("Failed to start Telegram bot:", error);
        throw error;
    }
}

// Command awal.
bot.start(async (ctx) => {
    await ctx.reply(
        [
            "Halo! Selamat datang di Sales Visit Bot.",
            "",
            "Gunakan /register untuk mendaftarkan akun.",
            "Gunakan /me untuk melihat profil.",
            "Gunakan /help untuk melihat panduan.",
            "Gunakan /salesvisit untuk membuat laporan kunjungan.",
        ].join("\n")
    );
});

// Menampilkan panduan penggunaan bot.
bot.help(async (ctx) => {
    await ctx.reply(
        [
            "SALES VISIT BOT - HELP",
            "",
            "USER COMMANDS",
            "/start - Memulai bot",
            "/register - Registrasi akun",
            "/me - Melihat profil akun",
            "/help - Menampilkan panduan",
            "",
            "SALES COMMANDS",
            "/jadwal - Melihat jadwal kunjungan hari ini",
            "/jadwal Jumat - Melihat jadwal pada hari tertentu",
            "/salesvisit - Membuat laporan kunjungan outlet",
            "/konfirmasi - Mengonfirmasi dan menyimpan laporan Sales Visit",
            "/batal - Membatalkan pengisian Sales Visit",
            "",
            "ADMIN & SUPERVISOR COMMANDS",
            "/jadwalsales - Melihat seluruh jadwal sales",
            "/jadwalsales Jumat - Filter jadwal berdasarkan hari",
            "/jadwalsales 123456789 - Filter berdasarkan Telegram ID",
            "/jadwalsales 123456789 Jumat - Filter sales dan hari",
            "",
            "OUTLET COMMANDS",
            "/outlets - Melihat seluruh daftar outlet",
            "/outlet ID_OUTLET - Melihat detail outlet",
            "",
            "ADMIN COMMANDS",
            "/pending - Melihat permintaan registrasi",
            "/approve ID ROLE - Menyetujui registrasi",
            "/reject ID - Menolak registrasi",
            "/users - Melihat seluruh pengguna",
            "/setrole ID ROLE_BARU - Mengubah role pengguna",
            "/disable ID - Menonaktifkan akun",
            "/enable ID - Mengaktifkan akun",
            "/tambahoutlet ID NO_RS NAMA_OUTLET - Menambah outlet",
            "/editoutlet ID_OUTLET NO_RS_BARU NAMA_OUTLET_BARU - Mengubah data outlet",
            "/hapusoutlet ID_OUTLET - Menghapus outlet",
            "",
            "AVAILABLE ROLES",
            "admin - Administrator sistem",
            "sales - Menginput data kunjungan outlet",
            "supervisor - Memantau aktivitas sales",
            "",
            "SALES VISIT INPUT FORMAT",
            "Outlet ID: ID_OUTLET",
            "Periode: Minggu ke-1 sampai Minggu ke-5",
            "Saldo Digipos: 1000000",
            "",
            "Data produk menggunakan urutan:",
            "Stok Selling Sellout",
            "Contoh: 1 2 3",
            "",
            "Status Outlet Aktif menggunakan:",
            "Y - Ya",
            "N - Tidak",
            "",
            "Total Belanja: 1884000",
            "",
            "NOTES",
            "- ID pada command admin menggunakan ID pengguna dari database.",
            "- ID_OUTLET menggunakan Outlet ID bisnis.",
            "- Telegram ID menggunakan ID akun Telegram.",
            "- Underscore (_) digunakan sebagai pengganti spasi untuk satu variabel.",
            "- Spasi digunakan untuk memisahkan dua variabel yang berbeda.",
            "- Periode laporan menggunakan bulan dan tahun berdasarkan tanggal laporan dibuat.",
            "- Gunakan /batal untuk membatalkan proses pengisian Sales Visit.",
        ].join("\n")
    );
});

// Command untuk memulai Sales Visit.
bot.command("salesvisit", async (ctx) => {
    if (ctx.scene.current) {
        await ctx.reply(
            "Anda sedang menjalankan proses lain. Selesaikan atau batalkan terlebih dahulu dengan /batal."
        );
        return;
    }

    await ctx.scene.enter("sales-visit");
});

// Mendaftarkan command autentikasi dan administrasi.
registerAuthCommands(bot);

// Mendaftarkan command jadwal kunjungan.
registerScheduleCommands(bot);

// Mendaftarkan command outlet.
registerOutletCommands(bot);
