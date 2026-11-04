
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
    const helpSections = [
        [
            "╔══════════════════════════╗",
            "       SALES VISIT BOT",
            "       PANDUAN PENGGUNAAN",
            "╚══════════════════════════╝",
            "",
            "CARA MEMBACA PANDUAN",
            "COMMAND  : Perintah yang dikirim ke bot.",
            "DESKRIPSI: Fungsi dari perintah.",
            "",
            "━━━━━━━━━━━━━━━━━━━━",
            "1. USER COMMANDS",
            "━━━━━━━━━━━━━━━━━━━━",
            "",
            "/start",
            "└ Memulai bot dan menampilkan sambutan.",
            "",
            "/register",
            "└ Mendaftarkan akun Telegram.",
            "",
            "/me",
            "└ Melihat profil, status akun, dan ID_TELEGRAM.",
            "",
            "/help",
            "└ Menampilkan panduan penggunaan bot.",
        ].join("\n"),

        [
            "━━━━━━━━━━━━━━━━━━━━",
            "2. SALES COMMANDS",
            "━━━━━━━━━━━━━━━━━━━━",
            "",
            "/jadwal",
            "└ Melihat jadwal kunjungan hari ini.",
            "",
            "/jadwal HARI",
            "└ Melihat jadwal berdasarkan hari.",
            "   HARI: SENIN, SELASA, RABU, KAMIS,",
            "         JUMAT, SABTU, MINGGU.",
            "",
            "/salesvisit",
            "└ Memulai pengisian laporan kunjungan outlet.",
            "",
            "/konfirmasi",
            "└ Mengonfirmasi dan menyimpan laporan.",
            "",
            "/batal",
            "└ Membatalkan pengisian Sales Visit.",
        ].join("\n"),

        [
            "━━━━━━━━━━━━━━━━━━━━",
            "3. ADMIN & SUPERVISOR COMMANDS",
            "━━━━━━━━━━━━━━━━━━━━",
            "",
            "/jadwalsales",
            "└ Melihat seluruh jadwal kunjungan sales.",
            "",
            "/jadwalsales HARI",
            "└ Filter jadwal berdasarkan hari.",
            "   HARI: SENIN, SELASA, RABU, KAMIS,",
            "         JUMAT, SABTU, MINGGU.",
            "",
            "/jadwalsales ID_TELEGRAM",
            "└ Filter jadwal berdasarkan Telegram ID sales.",
            "",
            "/jadwalsales ID_TELEGRAM HARI",
            "└ Filter jadwal berdasarkan sales dan hari.",
            "   HARI: SENIN, SELASA, RABU, KAMIS,",
            "         JUMAT, SABTU, MINGGU.",
        ].join("\n"),

        [
            "━━━━━━━━━━━━━━━━━━━━",
            "4. OUTLET COMMANDS",
            "━━━━━━━━━━━━━━━━━━━━",
            "",
            "/outlets",
            "└ Melihat seluruh daftar outlet.",
            "",
            "/outlet ID_OUTLET",
            "└ Melihat detail outlet berdasarkan ID.",
        ].join("\n"),

        [
            "━━━━━━━━━━━━━━━━━━━━",
            "5. ADMIN COMMANDS",
            "━━━━━━━━━━━━━━━━━━━━",
            "",
            "/pending",
            "└ Melihat permintaan registrasi pengguna.",
            "",
            "/approve ID_TELEGRAM ROLE",
            "└ Menyetujui registrasi pengguna.",
            "   ID_TELEGRAM: ID akun Telegram dari /me.",
            "   ROLE: ADMIN, SALES, atau SUPERVISOR.",
            "",
            "/reject ID_TELEGRAM",
            "└ Menolak permintaan registrasi.",
            "",
            "/users",
            "└ Melihat seluruh pengguna terdaftar.",
            "",
            "/setrole ID_TELEGRAM ROLE_BARU",
            "└ Mengubah role pengguna.",
            "   ID_TELEGRAM: ID akun Telegram dari /me.",
            "   ROLE_BARU: ADMIN, SALES, atau SUPERVISOR.",
            "",
            "/disable ID_TELEGRAM",
            "└ Menonaktifkan akun pengguna.",
            "",
            "/enable ID_TELEGRAM",
            "└ Mengaktifkan kembali akun pengguna.",
        ].join("\n"),

        [
            "━━━━━━━━━━━━━━━━━━━━",
            "6. OUTLET ADMIN COMMANDS",
            "━━━━━━━━━━━━━━━━━━━━",
            "",
            "/tambahoutlet ID NO_RS NAMA_OUTLET",
            "└ Menambahkan outlet baru.",
            "   ID: ID outlet bisnis.",
            "   NO_RS: Nomor registrasi outlet.",
            "   NAMA_OUTLET: Nama outlet.",
            "",
            "/editoutlet ID_OUTLET NO_RS_BARU NAMA_OUTLET_BARU",
            "└ Mengubah informasi outlet.",
            "",
            "/hapusoutlet ID_OUTLET",
            "└ Menghapus outlet berdasarkan ID.",
        ].join("\n"),

        [
            "━━━━━━━━━━━━━━━━━━━━",
            "7. AVAILABLE ROLES",
            "━━━━━━━━━━━━━━━━━━━━",
            "",
            "ADMIN",
            "└ Administrator pengelola sistem.",
            "",
            "SALES",
            "└ Menginput laporan kunjungan outlet.",
            "",
            "SUPERVISOR",
            "└ Memantau aktivitas sales.",
        ].join("\n"),

        [
            "━━━━━━━━━━━━━━━━━━━━",
            "8. SALES VISIT INPUT FORMAT",
            "━━━━━━━━━━━━━━━━━━━━",
            "",
            "OUTLET ID",
            "└ Masukkan ID outlet berupa angka.",
            "",
            "PERIODE",
            "└ Masukkan angka 1 sampai 5.",
            "",
            "SALDO DIGIPOS",
            "└ Masukkan nominal saldo.",
            "   Contoh: 1000000",
            "",
            "DATA PRODUK",
            "└ Urutan: Stok Selling Sellout.",
            "   Contoh: 1 2 3",
            "",
            "OUTLET AKTIF",
            "└ Y = Ya, N = Tidak.",
            "",
            "TOTAL BELANJA",
            "└ Masukkan nominal total belanja.",
            "   Contoh: 1884000",
        ].join("\n"),

        [
            "━━━━━━━━━━━━━━━━━━━━",
            "9. IMPORTANT NOTES",
            "━━━━━━━━━━━━━━━━━━━━",
            "",
            "- Gunakan /me untuk melihat ID_TELEGRAM.",
            "- Command administrasi pengguna menggunakan ID_TELEGRAM.",
            "- ID_OUTLET adalah ID bisnis outlet.",
            "- Gunakan underscore (_) untuk variabel dengan beberapa kata.",
            "- Gunakan spasi untuk memisahkan variabel berbeda.",
            "- HARI harus menggunakan:",
            "  SENIN, SELASA, RABU, KAMIS,",
            "  JUMAT, SABTU, atau MINGGU.",
            "- Bulan dan tahun laporan mengikuti tanggal laporan dibuat.",
            "- Periksa preview sebelum /konfirmasi.",
            "- Gunakan /batal untuk membatalkan pengisian.",
            "",
            "SALES VISIT BOT",
            "OUTLET VISIT MANAGEMENT SYSTEM",
        ].join("\n"),
    ];

    for (const section of helpSections) {
        await ctx.reply(section);
    }
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
