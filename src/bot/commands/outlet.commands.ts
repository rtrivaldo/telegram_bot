
import type { Telegraf } from "telegraf";
import { authService } from "../../services/auth.service.js";
import { outletService } from "../../services/outlet.service.js";
import type { CreateOutletInput } from "../../repositories/outlet.repository.js";

// Mengambil argumen command.
function getCommandArgs(text: string): string[] {
    return text.trim().split(/\s+/).slice(1);
}

// Memeriksa role dan status pengguna.
async function hasAccess(
    telegramId: number,
    allowedRoles: string[],
): Promise<boolean> {
    const user = await authService.findUser(telegramId);

    return (
        user !== null &&
        user.status === "active" &&
        user.role !== null &&
        allowedRoles.includes(user.role)
    );
}

// Memformat informasi outlet.
function formatOutlet(
    outlet: Awaited<ReturnType<typeof outletService.getOutletById>>,
): string {
    return [
        `Nama Outlet: ${outlet.outlet_name}`,
        `ID Outlet: ${outlet.outlet_id}`,
        `No. RS: ${outlet.no_rs}`,
    ].join("\n");
}

// Mendaftarkan seluruh command outlet.
export function registerOutletCommands(bot: Telegraf): void {

    // ==========================================
    // VIEW OUTLET COMMANDS
    // Admin dan Supervisor
    // ==========================================

    // Menampilkan seluruh outlet.
    bot.command("outlets", async (ctx) => {
        if (!(await hasAccess(ctx.from.id, ["admin", "supervisor"]))) {
            return ctx.reply("Akses ditolak. Khusus admin dan supervisor.");
        }

        try {
            const outlets = await outletService.getAllOutlets();

            if (outlets.length === 0) {
                return ctx.reply("Belum ada outlet terdaftar.");
            }

            const messages = outlets.map((outlet, index) =>
                [
                    `${index + 1}. ${outlet.outlet_name}`,
                    `ID: ${outlet.outlet_id}`,
                    `No. RS: ${outlet.no_rs}`,
                ].join("\n"),
            );

            return ctx.reply(
                [
                    "DAFTAR OUTLET",
                    "",
                    ...messages,
                    "",
                    `Total: ${outlets.length} outlet`,
                ].join("\n\n"),
            );
        } catch (error) {
            console.error("Gagal mengambil daftar outlet:", error);
            return ctx.reply("Terjadi kesalahan saat mengambil data outlet.");
        }
    });

    // Menampilkan detail outlet.
    // Contoh: /outlet 4300014332
    bot.command("outlet", async (ctx) => {
        if (!(await hasAccess(ctx.from.id, ["admin", "supervisor"]))) {
            return ctx.reply("Akses ditolak. Khusus admin dan supervisor.");
        }

        const args = getCommandArgs(ctx.message.text);
        const outletId = args[0];

        if (args.length !== 1 || !outletId) {
            return ctx.reply("Format: /outlet ID_OUTLET");
        }

        try {
            const outlet = await outletService.getOutletByOutletId(outletId);

            return ctx.reply(
                [
                    "DETAIL OUTLET",
                    "",
                    formatOutlet(outlet),
                ].join("\n"),
            );
        } catch (error) {
            return ctx.reply(
                error instanceof Error
                    ? error.message
                    : "Gagal mengambil detail outlet.",
            );
        }
    });

    // ==========================================
    // ADMIN OUTLET COMMANDS
    // ==========================================

    // Menambahkan outlet.
    // Contoh: /tambahoutlet 4300014332 81344640887 ASDA CELL
    bot.command("tambahoutlet", async (ctx) => {
        if (!(await hasAccess(ctx.from.id, ["admin"]))) {
            return ctx.reply("Akses ditolak. Khusus administrator.");
        }

        const args = getCommandArgs(ctx.message.text);

        if (args.length < 3) {
            return ctx.reply(
                [
                    "Format:",
                    "/tambahoutlet ID_OUTLET NO_RS NAMA_OUTLET",
                    "",
                    "Contoh:",
                    "/tambahoutlet 4300014332 81344640887 ASDA CELL",
                ].join("\n"),
            );
        }

        const [outletId, noRs, ...nameParts] = args;

        if (!outletId || !noRs || nameParts.length === 0) {
            return ctx.reply("Data outlet tidak lengkap.");
        }

        const input: CreateOutletInput = {
            outlet_id: outletId,
            no_rs: noRs,
            outlet_name: nameParts.join(" "),
        };

        try {
            const outlet = await outletService.createOutlet(input);

            return ctx.reply(
                [
                    "Outlet berhasil ditambahkan!",
                    "",
                    formatOutlet(outlet),
                ].join("\n"),
            );
        } catch (error) {
            console.error("Gagal menambahkan outlet:", error);

            return ctx.reply(
                error instanceof Error
                    ? error.message
                    : "Gagal menambahkan outlet.",
            );
        }
    });

    // Mengedit informasi outlet tanpa mengubah ID outlet.
    // Contoh: /editoutlet 4300014332 81344640888 ASDA CELL BARU
    bot.command("editoutlet", async (ctx) => {
        if (!(await hasAccess(ctx.from.id, ["admin"]))) {
            return ctx.reply("Akses ditolak. Khusus administrator.");
        }

        const args = getCommandArgs(ctx.message.text);

        if (args.length < 3) {
            return ctx.reply(
                [
                    "Format:",
                    "/editoutlet ID_OUTLET NO_RS_BARU NAMA_OUTLET_BARU",
                    "",
                    "Contoh:",
                    "/editoutlet 4300014332 81344640888 ASDA CELL BARU",
                ].join("\n"),
            );
        }

        const [outletId, noRs, ...nameParts] = args;

        if (!outletId || !noRs || nameParts.length === 0) {
            return ctx.reply("Data outlet tidak lengkap.");
        }

        try {
            const existingOutlet =
                await outletService.getOutletByOutletId(outletId);

            const updatedOutlet = await outletService.updateOutlet(
                existingOutlet.id,
                {
                    // ID outlet tidak ikut diperbarui.
                    outlet_id: existingOutlet.outlet_id,
                    no_rs: noRs,
                    outlet_name: nameParts.join(" "),
                },
            );

            return ctx.reply(
                [
                    "Outlet berhasil diperbarui!",
                    "",
                    formatOutlet(updatedOutlet),
                ].join("\n"),
            );
        } catch (error) {
            console.error("Gagal memperbarui outlet:", error);

            return ctx.reply(
                error instanceof Error
                    ? error.message
                    : "Gagal memperbarui outlet.",
            );
        }
    });


    // Menghapus outlet.
    // Contoh: /hapusoutlet 4300014332
    bot.command("hapusoutlet", async (ctx) => {
        if (!(await hasAccess(ctx.from.id, ["admin"]))) {
            return ctx.reply("Akses ditolak. Khusus administrator.");
        }

        const args = getCommandArgs(ctx.message.text);
        const outletId = args[0];

        if (args.length !== 1 || !outletId) {
            return ctx.reply("Format: /hapusoutlet ID_OUTLET");
        }

        try {
            const outlet =
                await outletService.getOutletByOutletId(outletId);

            const deletedOutlet =
                await outletService.deleteOutlet(outlet.id);

            return ctx.reply(
                `Outlet ${deletedOutlet.outlet_name} berhasil dihapus.`,
            );
        } catch (error) {
            console.error("Gagal menghapus outlet:", error);

            return ctx.reply(
                error instanceof Error
                    ? error.message
                    : "Gagal menghapus outlet.",
            );
        }
    });
}
