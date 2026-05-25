import { Request, Response } from "express";
import License from "../models/License.js";
import Purchase from "../models/Purchase.js";

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
        const { page = 1, limit = 20, status } = req.query;
        const licenses = await License.find()
            .populate("user", "name email")
            .populate("movie", "title price")
            .sort("-createdAt")
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const total = await License.countDocuments();
        res.json({
            success: true,
            data: licenses,
            pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
        });
    } catch (error: any) {
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