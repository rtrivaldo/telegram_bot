
import { scheduleRepository } from "../repositories/schedule.repository.js";

const DAYS = [
    "senin",
    "selasa",
    "rabu",
    "kamis",
    "jumat",
    "sabtu",
    "minggu",
];

class ScheduleService {
    async getSchedule(
        salesforceCode: string,
        day: string,
    ) {
        return scheduleRepository.findBySalesforceAndDay(
            salesforceCode,
            day,
        );
    }

    async getAllSchedules(day?: string) {
        if (day) {
            return scheduleRepository.findAllByDay(day);
        }

        return scheduleRepository.findAll();
    }

    async getSchedulesByTelegramId(
        telegramId: number,
        day?: string,
    ) {
        return scheduleRepository.findByTelegramId(
            telegramId,
            day,
        );
    }

    getToday(): string {
        return new Intl.DateTimeFormat("id-ID", {
            weekday: "long",
            timeZone: "Asia/Jakarta",
        }).format(new Date()).toLowerCase();
    }

    normalizeDay(day: string): string | null {
        const normalized = day.trim().toLowerCase();

        return DAYS.includes(normalized)
            ? normalized
            : null;
    }
}

export const scheduleService = new ScheduleService();
