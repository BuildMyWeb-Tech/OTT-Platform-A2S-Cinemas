import { Request, Response } from "express";
import User from "../models/User.js";
import Movie from "../models/Movie.js";
import Purchase from "../models/Purchase.js";
import License from "../models/License.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import path from "path";

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

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const getUploadUrl = async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, folder = "videos" } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ success: false, message: "fileName and fileType required" });
    }

    // Allowed video types only
    const allowedTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/mpeg"];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ success: false, message: "Only video files allowed (mp4, mov, avi)" });
    }

    // Generate unique key to avoid overwrites
    const ext = path.extname(fileName);
    const key = `${folder}/${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
    });

    // Presigned URL expires in 15 minutes — enough time to upload large files
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    return res.json({
      success: true,
      data: {
        uploadUrl,
        key, // This is what gets saved as movie.videoKey in MongoDB
      },
    });
  } catch (error: any) {
    console.error("getUploadUrl error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};