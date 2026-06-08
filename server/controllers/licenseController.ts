import { Request, Response } from "express";
import License from "../models/License.js";
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";
import Movie from "../models/Movie.js";
// GET /api/license/check/:movieId
export const checkLicense = async (req: Request, res: Response) => {
    try {
        const license = await License.findOne({
            user: req.user._id,
            movie: req.params.movieId,
        });

        if (!license || !license.isValid()) {
            return res.json({
                success: true,
                hasAccess: false,
                message: license ? "License expired" : "No license found",
            });
        }

        const daysLeft = Math.ceil((license.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        res.json({
            success: true,
            hasAccess: true,
            expiresAt: license.expiryDate,
            daysLeft,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/license/my
export const getMyLicenses = async (req: Request, res: Response) => {
    try {
        const licenses = await License.find({ user: req.user._id })
            .populate("movie", "title poster price expiryDays genre")
            .sort("-createdAt");

        const enriched = licenses.map((l) => ({
            ...l.toObject(),
            isActive: l.isValid(),
            daysLeft: Math.max(0, Math.ceil((l.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
        }));

        res.json({ success: true, data: enriched });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/license/all — Admin
export const getAllLicenses = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 15, search, status, sort } = req.query;
        const p = Math.max(1, Number(page));
        const l = Math.min(50, Number(limit));

        // Build base query — simpler approach using populate instead of aggregation
        const query: any = {};

        if (status === "revoked") {
            query.isRevoked = true;
        } else if (status === "active") {
            query.isRevoked = false;
            query.expiryDate = { $gt: new Date() };
        } else if (status === "expired") {
            query.isRevoked = false;
            query.expiryDate = { $lte: new Date() };
        }

        // Sort
        const sortObj: any = sort === "expiring"
            ? { expiryDate: 1 }
            : { createdAt: -1 };

        // If search — need to find user/movie IDs first
        if (search && String(search).trim()) {
            const rx = new RegExp(String(search).trim(), "i");

            const [matchingUsers, matchingMovies] = await Promise.all([
                User.find({ $or: [{ name: rx }, { email: rx }] }).select("_id"),
                Movie.find({ title: rx }).select("_id"),
            ]);

            const userIds = matchingUsers.map(u => u._id);
            const movieIds = matchingMovies.map(m => m._id);

            query.$or = [
                { user: { $in: userIds } },
                { movie: { $in: movieIds } },
            ];
        }

        const [total, licenses] = await Promise.all([
            License.countDocuments(query),
            License.find(query)
                .populate("user", "name email")
                .populate("movie", "title")
                .sort(sortObj)
                .skip((p - 1) * l)
                .limit(l),
        ]);

        res.json({
            success: true,
            data: licenses,
            pagination: {
                total,
                page: p,
                pages: Math.ceil(total / l),
            },
        });
    } catch (error: any) {
        console.error("getAllLicenses error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /api/license/:id/revoke — Admin
export const revokeLicense = async (req: Request, res: Response) => {
    try {
        const license = await License.findByIdAndUpdate(
            req.params.id,
            { isRevoked: true },
            { new: true }
        );
        if (!license) return res.status(404).json({ success: false, message: "License not found" });
        res.json({ success: true, message: "License revoked", data: license });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /api/license/:id/extend — Admin
export const extendLicense = async (req: Request, res: Response) => {
    try {
        const { days } = req.body;
        if (!days || days <= 0)
            return res.status(400).json({ success: false, message: "Valid days required" });

        const license = await License.findById(req.params.id);
        if (!license) return res.status(404).json({ success: false, message: "License not found" });

        license.expiryDate = new Date(license.expiryDate.getTime() + days * 24 * 60 * 60 * 1000);
        license.isRevoked = false;
        await license.save();

        res.json({ success: true, message: `License extended by ${days} days`, data: license });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};