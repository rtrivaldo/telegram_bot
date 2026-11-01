import { Telegraf } from "telegraf";
import { env } from "../config/env.js";
import { registerAuthCommands } from "./commands/auth.commands.js";

// Membuat instance Telegram Bot.
export const bot = new Telegraf(env.BOT_TOKEN);

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
            "/me - Melihat profil",
            "",
            "ADMIN COMMANDS",
            "/pending - Permintaan registrasi",
            "/approve ID ROLE - Approve pengguna",
            "/reject ID - Reject pengguna",
            "/users - Daftar pengguna",
            "/setrole ID ROLE - Mengubah role",
            "/disable ID - Menonaktifkan akun",
            "/enable ID - Mengaktifkan akun",
            "",
            "AVAILABLE ROLES",
            "admin - Administrator",
            "sales - Input data outlet",
            "supervisor - Memantau aktivitas sales",
        ].join("\n")
    );
});

// Mendaftarkan command autentikasi dan administrasi.
registerAuthCommands(bot);