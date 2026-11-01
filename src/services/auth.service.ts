
import {
    userRepository,
    type User,
    type UserRole,
    type UserStatus,
} from "../repositories/user.repository.js";

export type { User, UserRole, UserStatus };

export interface RegisterInput {
    telegramId: number;
    username?: string;
    firstName: string;
    lastName?: string;
}

class AuthService {
    async isAdministrator(telegramId: number): Promise<boolean> {
        const user = await userRepository.findByTelegramId(telegramId);

        return user?.status === "active" && user.role === "admin";
    }

    async isAdmin(telegramId: number): Promise<boolean> {
        return this.isAdministrator(telegramId);
    }

    async findUser(telegramId: number): Promise<User | null> {
        return userRepository.findByTelegramId(telegramId);
    }

    async register(input: RegisterInput): Promise<User | null> {
        return userRepository.register({
            telegram_id: input.telegramId,
            username: input.username ?? null,
            first_name: input.firstName,
            last_name: input.lastName ?? null,
        });
    }

    async getPendingUsers(): Promise<User[]> {
        return userRepository.findPendingUsers();
    }

    async getAllUsers(): Promise<User[]> {
        return userRepository.findAll();
    }

    async approve(
        telegramId: number,
        role: UserRole
    ): Promise<User | null> {
        return userRepository.approve(telegramId, role);
    }

    async reject(telegramId: number): Promise<User | null> {
        return userRepository.reject(telegramId);
    }

    async setRole(
        telegramId: number,
        role: UserRole
    ): Promise<User | null> {
        return userRepository.setRole(telegramId, role);
    }

    async setStatus(
        telegramId: number,
        status: "active" | "disabled"
    ): Promise<User | null> {
        return userRepository.setStatus(telegramId, status);
    }
}

export const authService = new AuthService();
