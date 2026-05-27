import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import licenseRoutes from "./routes/licenseRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import streamRoutes from "./routes/streamRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Root routes
app.get("/", (_req, res) => {
    res.send("OTT Platform API running");
});

app.get("/health", (_req, res) => {
    res.json({ status: "OTT API running" });
});

// API routes
console.log("Mounting routes...");

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/license", licenseRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);

// 404 handler
app.use((req, res) => {
    console.log("404 HIT:", req.originalUrl);
    res.status(404).send(`Cannot ${req.method} ${req.originalUrl}`);
});

// Start server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup error:", error);
    }
};

startServer();