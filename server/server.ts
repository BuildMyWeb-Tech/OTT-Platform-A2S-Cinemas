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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        "http://localhost:3001",        // admin panel
        "http://localhost:8081",        // expo web
        "http://192.168.1.10:3001",    // admin panel via IP
        "http://192.168.1.10:8081",    // expo web via IP
        "https://ott-platform-a2-s-cinemas.vercel.app",
    ],
    credentials: true,
}));
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