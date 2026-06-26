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
import reviewRoutes from "./routes/reviewRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        "http://localhost:3001",
        "http://localhost:8081",
        "https://ott-platform-a2-s-cinemas.vercel.app",
        "https://ott-platform-a2s-cinemas.vercel.app"
    ],
    credentials: true,
}));

// Body size limit — prevents large-payload DoS (TC-S11-014)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Debug middleware
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Root routes
app.get("/", (_req, res) => {
    res.send("OTT Platform API running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "A2S Cinemas API",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "A2S Cinemas API",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// API routes
console.log("Mounting routes...");
// Optimized home screen data — single request instead of 3
app.get("/api/home", async (req, res) => {
    try {
        const Movie = (await import("./models/Movie.js")).default;
        const Category = (await import("./models/Category.js")).default;
        const Notification = (await import("./models/Notification.js")).default;

        const [featured, movies, categories, notifications] = await Promise.all([
            Movie.find({ isActive: true, isFeatured: true })
                .select("-videoKey")
                .populate("categories", "name slug")
                .sort("-createdAt")
                .limit(6)
                .lean(),
            Movie.find({ isActive: true })
                .select("-videoKey")
                .populate("categories", "name slug")
                .sort("-createdAt")
                .limit(12)
                .lean(),
            Category.find({ isActive: true })
                .select("name slug")
                .sort("name")
                .lean(),
            Notification.find()
                .sort("-createdAt")
                .limit(20)
                .lean(),
        ]);

        res.json({ success: true, data: { featured, movies, categories, notifications } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/license", licenseRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 handler — clean JSON, no internals exposed
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler — MUST be last, 4 args required for Express to recognize it
// Catches: body-parser errors (oversized/malformed JSON), thrown errors from async
// handlers wrapped in try/catch that call next(err), and any uncaught sync errors.
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Oversized payload from express.json() limit
    if (err.type === "entity.too.large") {
        return res.status(413).json({ success: false, message: "Request payload too large" });
    }

    // Malformed JSON body
    if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
        return res.status(400).json({ success: false, message: "Invalid JSON in request body" });
    }

    // Mongoose CastError (bad ObjectId) — should be caught in controllers,
    // but this is a safety net
    if (err.name === "CastError") {
        return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    // Mongoose ValidationError
    if (err.name === "ValidationError") {
        return res.status(400).json({ success: false, message: err.message });
    }

    // Log full error server-side for debugging — never sent to client
    console.error("Unhandled error:", err);

    // Generic 500 — no stack trace, no internal details in response
    res.status(500).json({ success: false, message: "Internal server error" });
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
// Self-ping to prevent Render free tier cold starts
// Pings every 14 minutes — Render spins down after 15min inactivity
if (process.env.NODE_ENV === "production") {
    const SELF_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
    setInterval(async () => {
        try {
            await fetch(`${SELF_URL}/health`);
            console.log("Self-ping OK");
        } catch (e) {
            console.log("Self-ping failed:", e);
        }
    }, 14 * 60 * 1000);
}