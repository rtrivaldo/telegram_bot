import express from "express";
import apiRoutes from "./routes/index.js";

// Membuat instance Express.
const app = express();

// Middleware untuk membaca JSON request body.
app.use(express.json());

// Semua endpoint API menggunakan prefix /api.
app.use("/api", apiRoutes);

export default app;