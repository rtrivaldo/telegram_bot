import { Telegraf } from "telegraf";
import { env } from "../config/env.js";
import { registerAuthCommands } from "./commands/auth.commands.js";
import { registerScheduleCommands } from "./commands/schedule.commands.js";
import { registerOutletCommands } from "./commands/outlet.commands.js";

// Membuat instance Telegram Bot.
export const bot = new Telegraf(env.BOT_TOKEN);

bot.command("test", async (ctx) => {
    console.log("TEST COMMAND RECEIVED:", ctx.message.text);

    await ctx.reply("Bot berhasil menerima command!");
});

// Status Telegram Bot.
export const botStatus = {
    running: false,
};

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
            "NOTES",
            "- ID pada command admin menggunakan ID pengguna dari database.",
            "- ID_OUTLET menggunakan Outlet ID bisnis.",
            "- Telegram ID menggunakan ID akun Telegram.",
        ].join("\n")
    );
});


// Mendaftarkan command autentikasi dan administrasi.
registerAuthCommands(bot);

// Mendaftarkan command jadwal kunjungan.
registerScheduleCommands(bot);

// Mendaftarkan command outlet.
registerOutletCommands(bot);