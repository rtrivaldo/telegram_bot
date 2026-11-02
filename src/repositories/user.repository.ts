
import { db } from "../config/database.js";

export type UserRole = "admin" | "sales" | "supervisor";

export type UserStatus =
    | "pending"
    | "active"
    | "rejected"
    | "disabled";

export interface User {
    id: number;
    telegram_id: number;
    username: string | null;
    first_name: string;
    last_name: string | null;
    role: UserRole | null;
    status: UserStatus;
    salesforce_code: string | null;
    created_at: Date;
    updated_at: Date;
}

interface UserRow {
    id: string;
    telegram_id: string;
    username: string | null;
    first_name: string;
    last_name: string | null;
    role: UserRole | null;
    status: UserStatus;
    salesforce_code: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface RegisterUserInput {
    telegram_id: number;
    username: string | null;
    first_name: string;
    last_name: string | null;
}

// PostgreSQL BIGINT dikembalikan sebagai string oleh pg.
// Konversikan ke number agar sesuai dengan Telegram ID di Telegraf.
function mapUser(row: UserRow): User {
    return {
        ...row,
        id: Number(row.id),
        telegram_id: Number(row.telegram_id),
    };
}

class UserRepository {
    async findByTelegramId(
        telegramId: number,
    ): Promise<User | null> {
        const result = await db.query<UserRow>(
            `SELECT * FROM users WHERE telegram_id = $1`,
            [telegramId],
        );

        return result.rows[0]
            ? mapUser(result.rows[0])
            : null;
    }

    async register(
        input: RegisterUserInput,
    ): Promise<User | null> {
        const result = await db.query<UserRow>(
            `
            INSERT INTO users (
                telegram_id,
                username,
                first_name,
                last_name,
                status
            )
            VALUES ($1, $2, $3, $4, 'pending')

            ON CONFLICT (telegram_id)
            DO UPDATE SET
                username = EXCLUDED.username,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                status = 'pending',
                role = NULL,
                updated_at = NOW()

            WHERE users.status = 'rejected'

            RETURNING *
            `,
            [
                input.telegram_id,
                input.username,
                input.first_name,
                input.last_name,
            ],
        );

        if (result.rows[0]) {
            return mapUser(result.rows[0]);
        }

        // Jika user sudah terdaftar dan bukan rejected,
        // kembalikan data yang sudah ada tanpa mengubah statusnya.
        return this.findByTelegramId(input.telegram_id);
    }

    async findPendingUsers(): Promise<User[]> {
        const result = await db.query<UserRow>(
            `
            SELECT *
            FROM users
            WHERE status = 'pending'
            ORDER BY created_at ASC
            `,
        );

        return result.rows.map(mapUser);
    }

    async findAll(): Promise<User[]> {
        const result = await db.query<UserRow>(
            `
            SELECT *
            FROM users
            ORDER BY created_at DESC
            `,
        );

        return result.rows.map(mapUser);
    }

    async approve(
        telegramId: number,
        role: UserRole,
    ): Promise<User | null> {
        const result = await db.query<UserRow>(
            `
            UPDATE users
            SET
                role = $2,
                status = 'active',
                updated_at = NOW()
            WHERE telegram_id = $1
              AND status = 'pending'
            RETURNING *
            `,
            [telegramId, role],
        );

        return result.rows[0]
            ? mapUser(result.rows[0])
            : null;
    }

    async reject(telegramId: number): Promise<User | null> {
        const result = await db.query<UserRow>(
            `
            UPDATE users
            SET
                status = 'rejected',
                updated_at = NOW()
            WHERE telegram_id = $1
              AND status = 'pending'
            RETURNING *
            `,
            [telegramId],
        );

        return result.rows[0]
            ? mapUser(result.rows[0])
            : null;
    }

    async setRole(
        telegramId: number,
        role: UserRole,
    ): Promise<User | null> {
        const result = await db.query<UserRow>(
            `
            UPDATE users
            SET
                role = $2,
                updated_at = NOW()
            WHERE telegram_id = $1
              AND status = 'active'
            RETURNING *
            `,
            [telegramId, role],
        );

        return result.rows[0]
            ? mapUser(result.rows[0])
            : null;
    }

    async setStatus(
        telegramId: number,
        status: "active" | "disabled",
    ): Promise<User | null> {
        const result = await db.query<UserRow>(
            `
            UPDATE users
            SET
                status = $2,
                updated_at = NOW()
            WHERE telegram_id = $1
              AND (
                  (status = 'active' AND $2 = 'disabled')
                  OR
                  (status = 'disabled' AND $2 = 'active')
              )
            RETURNING *
            `,
            [telegramId, status],
        );

        return result.rows[0]
            ? mapUser(result.rows[0])
            : null;
    }
}

export const userRepository = new UserRepository();
