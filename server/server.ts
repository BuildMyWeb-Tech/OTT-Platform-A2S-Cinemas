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