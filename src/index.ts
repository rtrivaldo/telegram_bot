
import "dotenv/config";
import { Telegraf } from "telegraf";
import { z } from "zod";

const token = process.env.BOT_TOKEN;

if (!token) {
    throw new Error("BOT_TOKEN belum diatur di file .env");
}

const bot = new Telegraf(token);

// Format awal input kunjungan outlet
const visitSchema = z.object({
    outlet: z.string().min(1),
    tanggal: z.string().min(1),
    produk: z.string().min(1),
    catatan: z.string().min(1),
});

bot.start(async (ctx) => {
    await ctx.reply(
        [
            "Halo! Selamat datang di Sales Visit Bot.",
            "",
            "Bot ini digunakan untuk mencatat kunjungan outlet.",
            "",
            "Perintah yang tersedia:",
            "/start - Memulai bot",
            "/help - Panduan penggunaan",
            "/id - Melihat Telegram ID kamu",
            "/batal - Membatalkan input",
            "",
            "Kirim data kunjungan dalam satu pesan."
        ].join("\n")
    );
});

bot.help(async (ctx) => {
    await ctx.reply(
        [
            "FORMAT INPUT KUNJUNGAN",
            "",
            "Outlet: Nama Outlet",
            "Tanggal: 25-10-2026",
            "Produk: Telkomsel",
            "Catatan: Hasil kunjungan outlet",
            "",
            "Pastikan setiap kolom diisi."
        ].join("\n")
    );
});

bot.command("id", async (ctx) => {
    await ctx.reply(`Telegram ID kamu: ${ctx.from.id}`);
});

bot.command("batal", async (ctx) => {
    await ctx.reply("Perintah dibatalkan. Kamu bisa mengirim data baru.");
});

bot.on("text", async (ctx) => {
    const text = ctx.message.text;

    // Abaikan pesan perintah yang belum ditangani
    if (text.startsWith("/")) {
        return;
    }

    const fields = Object.fromEntries(
        text.split("\n").map((line) => {
            const separator = line.indexOf(":");

            if (separator === -1) {
                return ["", ""];
            }

            return [
                line.slice(0, separator).trim().toLowerCase(),
                line.slice(separator + 1).trim(),
            ];
        })
    );

    const result = visitSchema.safeParse({
        outlet: fields["outlet"],
        tanggal: fields["tanggal"],
        produk: fields["produk"],
        catatan: fields["catatan"],
    });

    if (!result.success) {
        console.warn("Input tidak valid", {
            userId: ctx.from.id,
            messageId: ctx.message.message_id,
        });
        return;
    }

    // Sementara dicatat di terminal.
    // Tahap berikutnya: simpan ke PostgreSQL.
    console.log("Kunjungan outlet:", {
        salesId: ctx.from.id,
        ...result.data,
        receivedAt: new Date().toISOString(),
    });

    console.info("Kunjungan berhasil diproses.");

    await ctx.reply(["Nama outlet: " + result.data.outlet, "Tanggal: " + result.data.tanggal, "Produk: " + result.data.produk, "Catatan: " + result.data.catatan, "", "Data berhasil disimpan."].join("\n"));
});

bot.catch((error, ctx) => {
    console.error(`Error pada update ${ctx.update.update_id}:`, error);
});

bot.launch().then(() => {
    console.log("Sales Visit Bot berhasil dijalankan.");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
