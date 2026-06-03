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
        const { page = 1, limit = 15, search, status, sort } = req.query;
        const p = Math.max(1, Number(page));
        const l = Math.min(50, Number(limit));

        // Build aggregation pipeline to support search across populated user/movie fields
        const pipeline: any[] = [];

        // Lookups for search
        pipeline.push(
            { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "userObj" } },
            { $lookup: { from: "movies", localField: "movie", foreignField: "_id", as: "movieObj" } },
            { $unwind: { path: "$userObj", preserveNullAndEmpty: true } },
            { $unwind: { path: "$movieObj", preserveNullAndEmpty: true } }
        );

        const match: any = {};

        // Status filter
        if (status === "revoked") {
            match.isRevoked = true;
        } else if (status === "active") {
            match.isRevoked = false;
            match.expiryDate = { $gt: new Date() };
        } else if (status === "expired") {
            match.isRevoked = false;
            match.expiryDate = { $lte: new Date() };
        }

        // Search — single character or full string
        if (search && String(search).trim()) {
            const rx = new RegExp(String(search).trim(), "i");
            match.$or = [
                { "userObj.name": rx },
                { "userObj.email": rx },
                { "movieObj.title": rx },
            ];
        }

        if (Object.keys(match).length > 0) pipeline.push({ $match: match });

        // Sort
        if (sort === "expiring") {
            pipeline.push({ $sort: { expiryDate: 1 } });
        } else {
            pipeline.push({ $sort: { createdAt: -1 } });
        }

        // Count total before pagination
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await License.aggregate(countPipeline);
        const total = countResult[0]?.total ?? 0;

        // Paginate
        pipeline.push({ $skip: (p - 1) * l }, { $limit: l });

        // Project — reshape to match populated format
        pipeline.push({
            $project: {
                _id: 1,
                expiryDate: 1,
                isRevoked: 1,
                createdAt: 1,
                user: {
                    _id: "$userObj._id",
                    name: "$userObj.name",
                    email: "$userObj.email",
                },
                movie: {
                    _id: "$movieObj._id",
                    title: "$movieObj.title",
                },
            },
        });

        const licenses = await License.aggregate(pipeline);

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