import { Request, Response } from "express";
import Purchase from "../models/Purchase.js";

// GET /api/purchases/my
export const getMyPurchases = async (req: Request, res: Response) => {
    try {
        const purchases = await Purchase.find({ user: req.user._id })
            .populate("movie", "title poster genre price expiryDays")
            .sort("-createdAt");
        res.json({ success: true, data: purchases });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/purchases/:id
export const getPurchase = async (req: Request, res: Response) => {
    try {
        const purchase = await Purchase.findById(req.params.id).populate("movie", "title poster genre");
        if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });
        if (purchase.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }
        res.json({ success: true, data: purchase });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/purchases/admin/all — Admin
export const getAllPurchases = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const query: any = {};
        if (status) query.status = status;

        // Revenue is computed independently of the list's own status filter/pagination —
        // it's always the true total across everything, matching the movie analytics page.
        // Only "active"/"expired" represent money actually captured; "pending"/"failed" don't.
        const [total, purchases, revenueAgg] = await Promise.all([
            Purchase.countDocuments(query),
            Purchase.find(query)
                .populate("user", "name email")
                .populate("movie", "title price")
                .sort("-createdAt")
                .skip((Number(page) - 1) * Number(limit))
                .limit(Number(limit)),
            Purchase.aggregate([
                { $match: { status: { $in: ["active", "expired"] } } },
                { $group: { _id: null, total: { $sum: "$amountPaid" }, count: { $sum: 1 } } },
            ]),
        ]);

        const revenue = revenueAgg[0] || { total: 0, count: 0 };

        res.json({
            success: true,
            data: purchases,
            pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
            revenue: { total: revenue.total, count: revenue.count },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};