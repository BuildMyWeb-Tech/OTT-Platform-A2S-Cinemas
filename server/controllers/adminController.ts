import { Request, Response } from "express";
import User from "../models/User.js";
import Movie from "../models/Movie.js";
import Purchase from "../models/Purchase.js";
import License from "../models/License.js";

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments({ role: "user" });
        const totalMovies = await Movie.countDocuments();
        const totalPurchases = await Purchase.countDocuments({ status: "active" });
        const activeLicenses = await License.countDocuments({ isRevoked: false, expiryDate: { $gt: new Date() } });

        const revenueResult = await Purchase.aggregate([
            { $match: { status: "active" } },
            { $group: { _id: null, total: { $sum: "$amountPaid" } } },
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        const topMovies = await Purchase.aggregate([
            { $match: { status: "active" } },
            { $group: { _id: "$movie", purchaseCount: { $sum: 1 }, revenue: { $sum: "$amountPaid" } } },
            { $sort: { purchaseCount: -1 } },
            { $limit: 5 },
            { $lookup: { from: "movies", localField: "_id", foreignField: "_id", as: "movie" } },
            { $unwind: "$movie" },
            { $project: { "movie.title": 1, "movie.poster": 1, purchaseCount: 1, revenue: 1 } },
        ]);

        const recentPurchases = await Purchase.find({ status: "active" })
            .sort("-createdAt")
            .limit(5)
            .populate("user", "name email")
            .populate("movie", "title price");

        res.json({
            success: true,
            data: { totalUsers, totalMovies, totalPurchases, activeLicenses, totalRevenue, topMovies, recentPurchases },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({ role: "user" }).select("-password").sort("-createdAt");
        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const blockUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true }).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, message: "User blocked", data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const unblockUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true }).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, message: "User unblocked", data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};