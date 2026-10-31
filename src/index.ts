
import "dotenv/config";
import { Telegraf } from "telegraf";
import {
    authService,
    type UserRole,
} from "./auth/auth.service";

// Mengambil token bot dari environment variable.
const token = process.env.BOT_TOKEN;

// Memastikan token tersedia sebelum bot dijalankan.
if (!token) {
    throw new Error("BOT_TOKEN belum diatur di file .env");
}

// Membuat instance Telegram bot.
const bot = new Telegraf(token);

// Daftar role yang diperbolehkan untuk pengguna.
const VALID_ROLES: UserRole[] = [
    "admin",
    "sales",
    "supervisor",
];

// Helper untuk memeriksa hak akses administrator.
async function isAdmin(telegramId: number): Promise<boolean> {
    return authService.isAdministrator(telegramId);
}

// Helper untuk memvalidasi format Telegram ID.
function isValidTelegramId(value: string): boolean {
    const id = Number(value);

    return Number.isSafeInteger(id) && id > 0;
}

// ==========================================
// START COMMAND
// ==========================================

// Menampilkan pesan pembuka ketika pengguna menjalankan /start.
bot.start(async (ctx) => {
    await ctx.reply(
        [
            "Halo! Selamat datang di Sales Visit Bot.",
            "",
            "Gunakan /login untuk mendaftarkan akun.",
            "Gunakan /me untuk melihat profil kamu.",
            "Gunakan /help untuk melihat panduan.",
        ].join("\n")
    );
});

// ==========================================
// HELP COMMAND
// ==========================================

// Menampilkan daftar command yang tersedia.
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
            "viewer - Melihat data",
        ].join("\n")
    );
});

// ==========================================
// AUTHENTICATION COMMANDS
// ==========================================

// Mendaftarkan pengguna menggunakan Telegram ID.
bot.command("register", async (ctx) => {
    // Mengambil informasi pengguna Telegram.
    const telegramUser = ctx.from;

    // Memproses registrasi pengguna.
    const user = await authService.register({
        telegramId: telegramUser.id,
        username: telegramUser.username ?? null,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name ?? null,
    });

    // Admin dari .env tidak perlu melakukan registrasi.
    if (!user) {
        return ctx.reply(
            "Akun kamu sudah terdaftar sebagai administrator."
        );
    }

    // Memberikan respons berdasarkan status akun.
    if (user.status === "active") {
        return ctx.reply(
            `Akun kamu sudah aktif dengan role ${user.role}.`
        );
    }

    if (user.status === "pending") {
        return ctx.reply(
            "Registrasi berhasil atau sedang menunggu persetujuan admin."
        );
    }

    if (user.status === "rejected") {
        return ctx.reply(
            "Registrasi kamu ditolak. Silakan hubungi administrator."
        );
    }

    if (user.status === "disabled") {
        return ctx.reply(
            "Akun kamu sedang dinonaktifkan. Hubungi administrator."
        );
    }
});

// Menampilkan informasi akun pengguna yang sedang login.
bot.command("me", async (ctx) => {
    // Administrator utama dikenali melalui ADMIN_IDS.
    if (authService.isAdmin(ctx.from.id)) {
        await ctx.reply(
            [
                "PROFIL PENGGUNA",
                "",
                `Telegram ID: ${ctx.from.id}`,
                `Nama: ${ctx.from.first_name}`,
                "Role: admin",
                "Status: active",
            ].join("\n")
        );
        return;
    }

    // Mengambil informasi pengguna dari database.
    const user = await authService.findUser(ctx.from.id);

    // Menangani pengguna yang belum pernah mendaftar.
    if (!user) {
        await ctx.reply("Kamu belum terdaftar. Gunakan /login.");
        return;
    }

    // Menampilkan informasi akun pengguna.
    await ctx.reply(
        [
            "PROFIL PENGGUNA",
            "",
            `Telegram ID: ${user.telegramId}`,
            `Username: ${user.username ?? "-"}`,
            `Nama: ${user.firstName}`,
            `Role: ${user.role ?? "-"}`,
            `Status: ${user.status}`,
            `Terdaftar: ${user.createdAt}`,
        ].join("\n")
    );
});

// ==========================================
// ADMIN COMMANDS
// ==========================================

// Menampilkan daftar pengguna yang menunggu approval.
bot.command("pending", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
        await ctx.reply("Akses ditolak. Khusus administrator.");
        return;
    }

    const users = await authService.getPendingUsers();

    if (users.length === 0) {
        await ctx.reply("Tidak ada permintaan registrasi.");
        return;
    }

    // Membuat daftar pengguna untuk ditampilkan.
    const messages = users.map((user, index) =>
        [
            `${index + 1}. ${user.firstName}`,
            `ID: ${user.telegramId}`,
            `Username: ${user.username ?? "-"}`,
            `Tanggal: ${user.createdAt}`,
        ].join("\n")
    );

    await ctx.reply(
        ["DAFTAR PERMINTAAN REGISTRASI", "", ...messages].join("\n\n")
    );
});

// Menyetujui registrasi dan menetapkan role pengguna.
bot.command("approve", async (ctx) => {
    const telegramId = ctx.message.text.split(/\s+/)[1];
    const role = ctx.message.text.split(/\s+/)[2];

    // Memastikan pengguna yang menjalankan command adalah admin.
    if (!(await isAdmin(ctx.from.id))) {
        return ctx.reply("Kamu tidak memiliki akses.");
    }

    // Memvalidasi Telegram ID dan role.
    if (
        !telegramId ||
        !role ||
        !isValidTelegramId(telegramId) ||
        !VALID_ROLES.includes(role as UserRole)
    ) {
        return ctx.reply(
            "Format: /approve TELEGRAM_ID ROLE\n\nRole: admin, sales, supervisor"
        );
    }

    const user = await authService.approve(
        Number(telegramId),
        role as UserRole
    );

    if (!user) {
        return ctx.reply("Pengguna tidak ditemukan atau bukan berstatus pending.");
    }

    await ctx.reply(
        `Pengguna ${user.firstName} berhasil disetujui dengan role ${user.role}.`
    );
});

// Menolak permintaan registrasi pengguna.
bot.command("reject", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
        await ctx.reply("Akses ditolak.");
        return;
    }

    const args = ctx.message.text.split(/\s+/);

    if (args.length !== 2 || args[1] === undefined || !isValidTelegramId(args[1])) {
        await ctx.reply("Format: /reject TELEGRAM_ID");
        return;
    }

    const telegramId = Number(args[1]);

    // Mengubah status pengguna menjadi rejected.
    const success = await authService.reject(telegramId);

    if (!success) {
        await ctx.reply("User tidak ditemukan atau bukan pending.");
        return;
    }

    await ctx.reply("Permintaan registrasi berhasil ditolak.");

    // Memberitahukan hasil penolakan kepada pengguna.
    try {
        await bot.telegram.sendMessage(
            telegramId,
            "Maaf, permintaan registrasi kamu ditolak oleh administrator."
        );
    } catch (error) {
        console.error("Gagal mengirim notifikasi:", error);
    }
});

// Menampilkan seluruh pengguna yang terdaftar.
bot.command("users", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
        await ctx.reply("Akses ditolak.");
        return;
    }

    const users = await authService.getAllUsers();

    if (users.length === 0) {
        await ctx.reply("Belum ada pengguna terdaftar.");
        return;
    }

    // Mengubah data pengguna menjadi daftar teks.
    const messages = users.map((user, index) =>
        [
            `${index + 1}. ${user.firstName}`,
            `ID: ${user.telegramId}`,
            `Role: ${user.role ?? "-"}`,
            `Status: ${user.status}`,
        ].join("\n")
    );

    await ctx.reply(
        ["DAFTAR PENGGUNA", "", ...messages].join("\n\n")
    );
});

// Mengubah role pengguna yang sudah aktif.
bot.command("setrole", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
        await ctx.reply("Akses ditolak.");
        return;
    }

    const args = ctx.message.text.split(/\s+/);
    const telegramId = Number(args[1]);
    const role = args[2] as UserRole;

    if (
        args.length !== 3 || args[1] === undefined ||
        !isValidTelegramId(args[1]) ||
        !VALID_ROLES.includes(role)
    ) {
        await ctx.reply(
            "Format: /setrole TELEGRAM_ID ROLE"
        );
        return;
    }

    // Administrator utama hanya dapat dikelola melalui .env.
    if (authService.isAdmin(telegramId)) {
        await ctx.reply(
            "Administrator utama dikelola melalui ADMIN_IDS."
        );
        return;
    }

    const user = await authService.setRole(telegramId, role);

    if (!user) {
        await ctx.reply("User tidak ditemukan atau belum aktif.");
        return;
    }

    await ctx.reply(
        `Role ${user.firstName} berhasil diubah menjadi ${role}.`
    );
});

// Menonaktifkan akun pengguna.
bot.command("disable", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
        await ctx.reply("Akses ditolak.");
        return;
    }

    const args = ctx.message.text.split(/\s+/);

    if (args.length !== 2 || args[1] === undefined || !isValidTelegramId(args[1])) {
        await ctx.reply("Format: /disable TELEGRAM_ID");
        return;
    }

    const telegramId = Number(args[1]);

    // Mencegah administrator utama dinonaktifkan melalui command.
    if (authService.isAdmin(telegramId)) {
        await ctx.reply(
            "Administrator utama tidak bisa dinonaktifkan di sini."
        );
        return;
    }

    const success = await authService.setStatus(
        telegramId,
        "disabled"
    );

    await ctx.reply(
        success
            ? "Pengguna berhasil dinonaktifkan."
            : "Pengguna tidak ditemukan."
    );
});

// Mengaktifkan kembali akun yang sebelumnya dinonaktifkan.
bot.command("enable", async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) {
        await ctx.reply("Akses ditolak.");
        return;
    }

    const args = ctx.message.text.split(/\s+/);

    if (args.length !== 2 || args[1] === undefined || !isValidTelegramId(args[1])) {
        await ctx.reply("Format: /enable TELEGRAM_ID");
        return;
    }

    const telegramId = Number(args[1]);

    const success = await authService.setStatus(
        telegramId,
        "active"
    );

    await ctx.reply(
        success
            ? "Pengguna berhasil diaktifkan kembali."
            : "Pengguna tidak ditemukan."
    );
});

// ==========================================
// ERROR HANDLING
// ==========================================

// Menangani error yang terjadi selama bot memproses update.
bot.catch((error, ctx) => {
    console.error(
        `Error pada update ${ctx.update.update_id}:`,
        error
    );
});

// ==========================================
// BOT INITIALIZATION
// ==========================================

// Menjalankan Telegram bot menggunakan long polling.
bot.launch().then(() => {
    console.log("Sales Visit Bot berhasil dijalankan.");
});

// Menghentikan bot dengan aman ketika proses menerima sinyal.
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
