import { db } from "../config/database.js";
import {
    outletRepository,
    type CreateOutletInput,
    type UpdateOutletInput,
    type Outlet,
} from "../repositories/outlet.repository.js";

class OutletService {
    async getAllOutlets(): Promise<Outlet[]> {
        return outletRepository.findAll();
    }

    async getOutletById(id: number): Promise<Outlet> {
        const outlet = await outletRepository.findById(id);

        if (!outlet) {
            throw new Error("Outlet tidak ditemukan.");
        }

        return outlet;
    }

    async getOutletByOutletId(
        outletId: string,
    ): Promise<Outlet> {
        const outlet = await outletRepository.findByOutletId(
            outletId,
        );

        if (!outlet) {
            throw new Error("Outlet tidak ditemukan.");
        }

        return outlet;
    }

    async createOutlet(
        input: CreateOutletInput,
    ): Promise<Outlet> {
        this.validateOutletInput(input);

        const existingOutlet =
            await outletRepository.findByOutletId(input.outlet_id);

        if (existingOutlet) {
            throw new Error("ID outlet sudah terdaftar.");
        }

        return outletRepository.create(input);
    }

    async updateOutlet(
        id: number,
        input: UpdateOutletInput,
    ): Promise<Outlet> {
        this.validateOutletInput(input);

        const outlet = await outletRepository.findById(id);

        if (!outlet) {
            throw new Error("Outlet tidak ditemukan.");
        }

        const existingOutlet =
            await outletRepository.findByOutletId(input.outlet_id);

        if (existingOutlet && existingOutlet.id !== id) {
            throw new Error("ID outlet sudah digunakan outlet lain.");
        }

        const updatedOutlet = await outletRepository.update(
            id,
            input,
        );

        if (!updatedOutlet) {
            throw new Error("Gagal memperbarui outlet.");
        }

        return updatedOutlet;
    }

    async deleteOutlet(id: number): Promise<Outlet> {
        const outlet = await outletRepository.findById(id);

        if (!outlet) {
            throw new Error("Outlet tidak ditemukan.");
        }

        const scheduleCheck = await db.query(
            `
            SELECT 1
            FROM outlet_visit_schedules
            WHERE outlet_id = $1
            LIMIT 1
            `,
            [id],
        );

        if ((scheduleCheck.rowCount ?? 0) > 0) {
            throw new Error(
                "Outlet tidak dapat dihapus karena masih memiliki jadwal kunjungan.",
            );
        }

        const deletedOutlet = await outletRepository.delete(id);

        if (!deletedOutlet) {
            throw new Error("Gagal menghapus outlet.");
        }

        return deletedOutlet;
    }

    private validateOutletInput(
        input: CreateOutletInput | UpdateOutletInput,
    ): void {
        if (!input.outlet_id.trim()) {
            throw new Error("ID outlet wajib diisi.");
        }

        if (!input.no_rs.trim()) {
            throw new Error("Nomor RS wajib diisi.");
        }

        if (!input.outlet_name.trim()) {
            throw new Error("Nama outlet wajib diisi.");
        }
    }
}

export const outletService = new OutletService();
