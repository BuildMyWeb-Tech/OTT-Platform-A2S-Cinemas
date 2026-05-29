import { Request, Response } from "express";
import User from "../models/User.js";
import Movie from "../models/Movie.js";
import Purchase from "../models/Purchase.js";
import License from "../models/License.js";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Run ALL counts in parallel — this is what caused the 49s timeout
    const [totalUsers, totalMovies, purchaseAgg, activeLicenses] = await Promise.all([
      User.countDocuments({}),
      Movie.countDocuments({ isActive: true }),
      Purchase.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amountPaid" },
            totalPurchases: { $sum: 1 },
          },
        },
      ]),
      License.countDocuments({ isRevoked: false, expiryDate: { $gt: new Date() } }),
    ]);

    const agg = purchaseAgg[0] || { totalRevenue: 0, totalPurchases: 0 };

    res.json({
      success: true,
      data: {
        totalUsers,
        totalMovies,
        totalRevenue: agg.totalRevenue,
        totalPurchases: agg.totalPurchases,
        activeLicenses,
      },
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