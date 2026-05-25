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

await connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("OTT Platform API running"));
app.get("/health", (_req, res) => res.json({ status: "OTT API running" }));

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/license", licenseRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));