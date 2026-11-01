
import fs from "node:fs/promises";
import path from "node:path";

// Daftar role yang tersedia di dalam sistem.
export type UserRole = "admin" | "sales" | "supervisor";

// Status akun pengguna.
export type UserStatus = "pending" | "active" | "rejected" | "disabled";

// Struktur data pengguna Telegram.
export interface TelegramUser {
    telegramId: number;
    username: string | null;
    firstName: string;
    lastName: string | null;
    role: UserRole | null;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}

// Lokasi penyimpanan database JSON.
const DATA_DIR = path.resolve(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

class AuthService {

    // Memastikan folder dan file database tersedia.
    private async ensureFile(): Promise<void> {
        await fs.mkdir(DATA_DIR, { recursive: true });

        try {
            await fs.access(USERS_FILE);
        } catch {
            await fs.writeFile(USERS_FILE, "[]", "utf-8");
        }
    }

    // Mengambil seluruh data pengguna dari database.
    private async readUsers(): Promise<TelegramUser[]> {
        await this.ensureFile();

        const content = await fs.readFile(USERS_FILE, "utf-8");

        return JSON.parse(content) as TelegramUser[];
    }

    // Menyimpan perubahan data pengguna ke database.
    private async writeUsers(users: TelegramUser[]): Promise<void> {
        await this.ensureFile();

        const tempFile = `${USERS_FILE}.tmp`;

        await fs.writeFile(
            tempFile,
            JSON.stringify(users, null, 2),
            "utf-8"
        );

        await fs.rename(tempFile, USERS_FILE);
    }

    // Mengambil daftar Telegram ID administrator dari .env.
    private getAdminIds(): number[] {
        return (process.env.ADMIN_IDS ?? "")
            .split(",")
            .map((id) => Number(id.trim()))
            .filter((id) => Number.isSafeInteger(id) && id > 0);
    }

    // Memeriksa apakah pengguna merupakan administrator utama.
    isAdmin(telegramId: number): boolean {
        return this.getAdminIds().includes(telegramId);
    }

    // Memeriksa apakah pengguna memiliki role administrator.
    async isAdministrator(telegramId: number): Promise<boolean> {
        if (this.isAdmin(telegramId)) {
            return true;
        }

        const user = await this.findUser(telegramId);

        return user?.status === "active" && user.role === "admin";
    }

    // Mencari pengguna berdasarkan Telegram ID.
    async findUser(
        telegramId: number
    ): Promise<TelegramUser | undefined> {
        const users = await this.readUsers();

        return users.find((user) => user.telegramId === telegramId);
    }

    // Mendaftarkan pengguna baru dengan status pending.
    async register(input: {
        telegramId: number;
        username: string | null;
        firstName: string;
        lastName: string | null;
    }): Promise<TelegramUser | null> {

        // Admin yang terdaftar di .env tidak perlu melakukan registrasi.
        if (this.isAdmin(input.telegramId)) {
            return null;
        }

        const users = await this.readUsers();

        // Memeriksa apakah pengguna sudah pernah terdaftar.
        const existing = users.find(
            (user) => user.telegramId === input.telegramId
        );

        if (existing) {
            // Pengguna yang sebelumnya ditolak dapat mengajukan registrasi ulang.
            if (existing.status === "rejected") {
                existing.status = "pending";
                existing.updatedAt = new Date().toISOString();

                await this.writeUsers(users);
            }

            return existing;
        }

        // Membuat akun baru dengan status pending.
        const now = new Date().toISOString();

        const newUser: TelegramUser = {
            ...input,
            role: null,
            status: "pending",
            createdAt: now,
            updatedAt: now,
        };

        users.push(newUser);
        await this.writeUsers(users);

        return newUser;
    }

    // Mengambil seluruh pengguna yang menunggu persetujuan.
    async getPendingUsers(): Promise<TelegramUser[]> {
        const users = await this.readUsers();

        return users.filter((user) => user.status === "pending");
    }

    // Mengambil seluruh data pengguna.
    async getAllUsers(): Promise<TelegramUser[]> {
        return this.readUsers();
    }

    // Menyetujui registrasi dan menetapkan role pengguna.
    async approve(
        telegramId: number,
        role: UserRole
    ): Promise<TelegramUser | undefined> {
        const users = await this.readUsers();

        const user = users.find(
            (item) => item.telegramId === telegramId
        );

        // Hanya pengguna berstatus pending yang bisa disetujui.
        if (!user || user.status !== "pending") {
            return undefined;
        }

        user.role = role;
        user.status = "active";
        user.updatedAt = new Date().toISOString();

        await this.writeUsers(users);

        return user;
    }

    // Menolak permintaan registrasi pengguna.
    async reject(telegramId: number): Promise<boolean> {
        const users = await this.readUsers();

        const user = users.find(
            (item) => item.telegramId === telegramId
        );

        if (!user || user.status !== "pending") {
            return false;
        }

        user.status = "rejected";
        user.updatedAt = new Date().toISOString();

        await this.writeUsers(users);

        return true;
    }

    // Mengubah role pengguna yang sudah aktif.
    async setRole(
        telegramId: number,
        role: UserRole
    ): Promise<TelegramUser | undefined> {
        const users = await this.readUsers();

        const user = users.find(
            (item) => item.telegramId === telegramId
        );

        if (!user || user.status !== "active") {
            return undefined;
        }

        user.role = role;
        user.updatedAt = new Date().toISOString();

        await this.writeUsers(users);

        return user;
    }

    // Mengubah status akun menjadi active atau disabled.
    async setStatus(
        telegramId: number,
        status: "active" | "disabled"
    ): Promise<boolean> {
        const users = await this.readUsers();

        const user = users.find(
            (item) => item.telegramId === telegramId
        );

        if (!user) {
            return false;
        }

        user.status = status;
        user.updatedAt = new Date().toISOString();

        await this.writeUsers(users);

        return true;
    }
}

// Membuat satu instance agar dapat digunakan di seluruh aplikasi.
export const authService = new AuthService();
