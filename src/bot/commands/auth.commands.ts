
import type { Telegraf } from "telegraf";

import {
    authService,
    type UserRole,
} from "../../services/auth.service.js";

// Daftar role yang diperbolehkan dalam sistem.
const VALID_ROLES: UserRole[] = [
    "admin",
    "sales",
    "supervisor",
];

// Memeriksa apakah Telegram ID merupakan administrator.
async function isAdmin(telegramId: number): Promise<boolean> {
    return authService.isAdministrator(telegramId);
}

// Memvalidasi format Telegram ID.
function isValidTelegramId(value: string): boolean {
    const id = Number(value);

    return Number.isSafeInteger(id) && id > 0;
}

// Memvalidasi apakah role termasuk role yang tersedia.
function isValidRole(value: string): value is UserRole {
    return VALID_ROLES.includes(value as UserRole);
}

// Mengambil argumen dari teks command.
// Contoh: /approve 123456789 sales
// Hasil: ["123456789", "sales"]
function getCommandArgs(text: string): string[] {
    return text.trim().split(/\s+/).slice(1);
}

// Mendaftarkan seluruh command autentikasi dan administrasi.
export function registerAuthCommands(bot: Telegraf): void {

    // ==========================================
    // REGISTRATION COMMAND
    // ==========================================

    // Mendaftarkan pengguna menggunakan Telegram ID.
    bot.command("register", async (ctx) => {
        const telegramUser = ctx.from;

        const user = await authService.register({
            telegramId: telegramUser.id,
            username: telegramUser.username ?? null,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name ?? null,
        });

        // Administrator yang terdaftar di .env tidak perlu registrasi.
        if (!user) {
            return ctx.reply(
                "Akun kamu sudah terdaftar sebagai administrator."
            );
        }

        // Memberikan respons berdasarkan status akun.
        switch (user.status) {
            case "active":
                return ctx.reply(
                    `Akun kamu sudah aktif dengan role ${user.role}.`
                );

            case "pending":
                return ctx.reply(
                    "Registrasi berhasil atau sedang menunggu persetujuan admin."
                );

            case "rejected":
                return ctx.reply(
                    "Registrasi kamu ditolak. Silakan hubungi administrator."
                );

            case "disabled":
                return ctx.reply(
                    "Akun kamu sedang dinonaktifkan. Hubungi administrator."
                );
        }
    });


    // ==========================================
    // USER PROFILE COMMAND
    // ==========================================

    // Menampilkan informasi akun pengguna.
    bot.command("me", async (ctx) => {
        const telegramUser = ctx.from;

        // Administrator utama dikenali melalui ADMIN_IDS.
        if (authService.isAdmin(telegramUser.id)) {
            return ctx.reply(
                [
                    "PROFIL PENGGUNA",
                    "",
                    `Telegram ID: ${telegramUser.id}`,
                    `Nama: ${telegramUser.first_name}`,
                    "Role: admin",
                    "Status: active",
                ].join("\n")
            );
        }

        // Mengambil informasi pengguna dari database.
        const user = await authService.findUser(telegramUser.id);

        if (!user) {
            return ctx.reply(
                "Kamu belum terdaftar. Gunakan /register."
            );
        }

        // Menampilkan informasi akun pengguna.
        return ctx.reply(
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

    // Menampilkan pengguna yang menunggu persetujuan.
    bot.command("pending", async (ctx) => {
        if (!(await isAdmin(ctx.from.id))) {
            return ctx.reply(
                "Akses ditolak. Khusus administrator."
            );
        }

        const users = await authService.getPendingUsers();

        if (users.length === 0) {
            return ctx.reply(
                "Tidak ada permintaan registrasi."
            );
        }

        // Mengubah data pengguna menjadi daftar teks.
        const messages = users.map((user, index) =>
            [
                `${index + 1}. ${user.firstName}`,
                `ID: ${user.telegramId}`,
                `Username: ${user.username ?? "-"}`,
                `Tanggal: ${user.createdAt}`,
            ].join("\n")
        );

        return ctx.reply(
            [
                "DAFTAR PERMINTAAN REGISTRASI",
                "",
                ...messages,
            ].join("\n\n")
        );
    });


    // Menyetujui registrasi dan menetapkan role pengguna.
    // Contoh: /approve 123456789 sales
    bot.command("approve", async (ctx) => {
        if (!(await isAdmin(ctx.from.id))) {
            return ctx.reply("Kamu tidak memiliki akses.");
        }

        const args = getCommandArgs(ctx.message.text);
        const telegramId = args[0];
        const role = args[1];

        // Memvalidasi Telegram ID dan role.
        if (
            args.length !== 2 ||
            !telegramId ||
            !role ||
            !isValidTelegramId(telegramId) ||
            !isValidRole(role)
        ) {
            return ctx.reply(
                "Format: /approve TELEGRAM_ID ROLE\n\n" +
                "Role: admin, sales, supervisor"
            );
        }

        const user = await authService.approve(
            Number(telegramId),
            role
        );

        if (!user) {
            return ctx.reply(
                "Pengguna tidak ditemukan atau bukan berstatus pending."
            );
        }

        await ctx.reply(
            `Pengguna ${user.firstName} berhasil disetujui dengan role ${user.role}.`
        );

        // Memberitahukan pengguna bahwa akunnya telah disetujui.
        try {
            await ctx.telegram.sendMessage(
                Number(telegramId),
                `Registrasi kamu telah disetujui!\nRole: ${user.role}`
            );
        } catch (error) {
            console.error("Gagal mengirim notifikasi:", error);
        }
    });


    // Menolak permintaan registrasi pengguna.
    // Contoh: /reject 123456789
    bot.command("reject", async (ctx) => {
        if (!(await isAdmin(ctx.from.id))) {
            return ctx.reply("Akses ditolak.");
        }

        const args = getCommandArgs(ctx.message.text);
        const telegramId = args[0];

        if (
            args.length !== 1 ||
            !telegramId ||
            !isValidTelegramId(telegramId)
        ) {
            return ctx.reply(
                "Format: /reject TELEGRAM_ID"
            );
        }

        const userId = Number(telegramId);

        const success = await authService.reject(userId);

        if (!success) {
            return ctx.reply(
                "User tidak ditemukan atau bukan berstatus pending."
            );
        }

        await ctx.reply(
            "Permintaan registrasi berhasil ditolak."
        );

        // Memberitahukan pengguna bahwa registrasinya ditolak.
        try {
            await ctx.telegram.sendMessage(
                userId,
                "Maaf, permintaan registrasi kamu ditolak oleh administrator."
            );
        } catch (error) {
            console.error("Gagal mengirim notifikasi:", error);
        }
    });


    // Menampilkan seluruh pengguna yang terdaftar.
    bot.command("users", async (ctx) => {
        if (!(await isAdmin(ctx.from.id))) {
            return ctx.reply("Akses ditolak.");
        }

        const users = await authService.getAllUsers();

        if (users.length === 0) {
            return ctx.reply(
                "Belum ada pengguna terdaftar."
            );
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

        return ctx.reply(
            [
                "DAFTAR PENGGUNA",
                "",
                ...messages,
            ].join("\n\n")
        );
    });


    // Mengubah role pengguna yang sudah aktif.
    // Contoh: /setrole 123456789 supervisor
    bot.command("setrole", async (ctx) => {
        if (!(await isAdmin(ctx.from.id))) {
            return ctx.reply("Akses ditolak.");
        }

        const args = getCommandArgs(ctx.message.text);
        const telegramId = args[0];
        const role = args[1];

        if (
            args.length !== 2 ||
            !telegramId ||
            !role ||
            !isValidTelegramId(telegramId) ||
            !isValidRole(role)
        ) {
            return ctx.reply(
                "Format: /setrole TELEGRAM_ID ROLE\n\n" +
                "Role: admin, sales, supervisor"
            );
        }

        const userId = Number(telegramId);

        // Administrator utama hanya dapat dikelola melalui .env.
        if (authService.isAdmin(userId)) {
            return ctx.reply(
                "Administrator utama dikelola melalui ADMIN_IDS."
            );
        }

        const user = await authService.setRole(userId, role);

        if (!user) {
            return ctx.reply(
                "User tidak ditemukan atau belum aktif."
            );
        }

        return ctx.reply(
            `Role ${user.firstName} berhasil diubah menjadi ${role}.`
        );
    });


    // Menonaktifkan akun pengguna.
    // Contoh: /disable 123456789
    bot.command("disable", async (ctx) => {
        if (!(await isAdmin(ctx.from.id))) {
            return ctx.reply("Akses ditolak.");
        }

        const args = getCommandArgs(ctx.message.text);
        const telegramId = args[0];

        if (
            args.length !== 1 ||
            !telegramId ||
            !isValidTelegramId(telegramId)
        ) {
            return ctx.reply(
                "Format: /disable TELEGRAM_ID"
            );
        }

        const userId = Number(telegramId);

        // Mencegah administrator utama dinonaktifkan.
        if (authService.isAdmin(userId)) {
            return ctx.reply(
                "Administrator utama tidak bisa dinonaktifkan di sini."
            );
        }

        const success = await authService.setStatus(
            userId,
            "disabled"
        );

        return ctx.reply(
            success
                ? "Pengguna berhasil dinonaktifkan."
                : "Pengguna tidak ditemukan atau statusnya bukan active."
        );
    });


    // Mengaktifkan kembali akun yang sebelumnya dinonaktifkan.
    // Contoh: /enable 123456789
    bot.command("enable", async (ctx) => {
        if (!(await isAdmin(ctx.from.id))) {
            return ctx.reply("Akses ditolak.");
        }

        const args = getCommandArgs(ctx.message.text);
        const telegramId = args[0];

        if (
            args.length !== 1 ||
            !telegramId ||
            !isValidTelegramId(telegramId)
        ) {
            return ctx.reply(
                "Format: /enable TELEGRAM_ID"
            );
        }

        const userId = Number(telegramId);

        const success = await authService.setStatus(
            userId,
            "active"
        );

        return ctx.reply(
            success
                ? "Pengguna berhasil diaktifkan kembali."
                : "Pengguna tidak ditemukan atau statusnya bukan disabled."
        );
    });
}
