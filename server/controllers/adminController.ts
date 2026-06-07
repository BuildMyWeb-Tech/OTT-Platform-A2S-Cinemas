import { Request, Response } from "express";
import User from "../models/User.js";
import Movie from "../models/Movie.js";
import Purchase from "../models/Purchase.js";
import License from "../models/License.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import mongoose from "mongoose";
import Review from "../models/Review.js";

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
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
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
  ChecksumAlgorithm: undefined,  // explicitly disable checksum
});

const uploadUrl = await getSignedUrl(s3, command, {
  expiresIn: 900,
  unhoistableHeaders: new Set(["x-amz-checksum-crc32", "x-amz-sdk-checksum-algorithm"]),
});

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

// ── GET /api/admin/analytics/:movieId ────────────────────────────────────────
export const getMovieAnalytics = async (req: Request, res: Response) => {
    try {
        const { movieId } = req.params;
        const { period = "all", from, to } = req.query;

        // FIX 1: Cast to string before ObjectId validation
        const movieIdStr = String(movieId);
        if (!mongoose.Types.ObjectId.isValid(movieIdStr)) {
            return res.status(400).json({ success: false, message: "Invalid movie ID" });
        }

        // FIX 1: Use movieIdStr in all DB calls
        const movie = await Movie.findById(movieIdStr).select("-videoKey");
        if (!movie) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }

        // Build date filter
        const dateFilter: any = {};
        const now = new Date();

        if (period === "7d") {
            dateFilter.$gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === "30d") {
            dateFilter.$gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (period === "90d") {
            dateFilter.$gte = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        } else if (period === "custom" && from && to) {
            dateFilter.$gte = new Date(String(from));
            dateFilter.$lte = new Date(String(to));
        }

        // FIX 1: Use movieIdStr in all DB calls
        const purchaseQuery: any = {
            movie: movieIdStr,
            status: { $in: ["active", "expired"] },
        };
        if (Object.keys(dateFilter).length > 0) {
            purchaseQuery.purchaseDate = dateFilter;
        }

        // Parallel queries for performance
        const [purchases, reviewAgg] = await Promise.all([
            Purchase.find(purchaseQuery)
                .populate("user", "name email")
                .sort({ purchaseDate: -1 }),
            Review.aggregate([
                // FIX 1: Use movieIdStr in all DB calls
                { $match: { movieId: new mongoose.Types.ObjectId(movieIdStr) } },
                {
                    $group: {
                        _id: null,
                        average: { $avg: "$rating" },
                        count: { $sum: 1 },
                        distribution: {
                            $push: "$rating",
                        },
                    },
                },
            ]),
        ]);

        const totalRevenue = purchases.reduce((sum, p) => sum + p.amountPaid, 0);

        // Rating distribution 1–5
        const ratingDist = [1, 2, 3, 4, 5].map((star) => ({
            star,
            count: (reviewAgg[0]?.distribution || []).filter((r: number) => r === star).length,
        }));

        // Purchaser list with license status
        const purchaserIds = purchases.map((p) => (p.user as any)?._id);
        // FIX 1: Use movieIdStr in all DB calls
        const licenses = await License.find({
            user: { $in: purchaserIds },
            movie: movieIdStr,
        });
        const licenseMap = new Map(licenses.map((l) => [String(l.user), l]));

        const purchasers = purchases.map((p) => {
            const user = p.user as any;
            const license = licenseMap.get(String(user?._id));
            return {
                userId: user?._id,
                name: user?.name ?? "—",
                email: user?.email ?? "—",
                purchaseDate: p.purchaseDate,
                amountPaid: p.amountPaid,
                licenseStatus: license
                    ? license.isRevoked
                        ? "revoked"
                        : new Date(license.expiryDate) > now
                        ? "active"
                        : "expired"
                    : "none",
            };
        });

        res.json({
            success: true,
            data: {
                movie: {
                    _id: movie._id,
                    title: movie.title,
                    poster: movie.poster,
                    price: movie.price,
                    genre: movie.genre,
                },
                summary: {
                    totalPurchases: purchases.length,
                    totalRevenue,
                    averageRating: Math.round((reviewAgg[0]?.average ?? 0) * 10) / 10,
                    reviewCount: reviewAgg[0]?.count ?? 0,
                    ratingDistribution: ratingDist,
                },
                purchasers,
                period,
            },
        });
    } catch (error: any) {
        console.error("Movie analytics error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /api/admin/analytics/:movieId/export ──────────────────────────────────
export const exportMovieAnalytics = async (req: Request, res: Response) => {
    try {
        const movieIdStr = String(req.params.movieId);
        const format = String(req.query.format || "csv");
        const period = String(req.query.period || "all");

        if (!mongoose.Types.ObjectId.isValid(movieIdStr)) {
            return res.status(400).json({ success: false, message: "Invalid movie ID" });
        }

        const movie = await Movie.findById(movieIdStr).select("title price genre");
        if (!movie) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }

        const purchaseQuery: any = { movie: movieIdStr, status: { $in: ["active", "expired"] } };
        const now = new Date();

        if (period === "7d")  purchaseQuery.purchaseDate = { $gte: new Date(now.getTime() - 7  * 86400000) };
        if (period === "30d") purchaseQuery.purchaseDate = { $gte: new Date(now.getTime() - 30 * 86400000) };
        if (period === "90d") purchaseQuery.purchaseDate = { $gte: new Date(now.getTime() - 90 * 86400000) };

        const purchases = await Purchase.find(purchaseQuery)
            .populate("user", "name email")
            .sort({ purchaseDate: -1 });

        const licenses = await License.find({ movie: movieIdStr });
        const licenseMap = new Map(licenses.map((l) => [String(l.user), l]));

        const rows = purchases.map((p) => {
            const user = p.user as any;
            const license = licenseMap.get(String(user?._id));
            const licenseStatus = license
                ? license.isRevoked ? "revoked"
                  : new Date(license.expiryDate) > now ? "active" : "expired"
                : "none";
            return {
                name: (user?.name ?? "").replace(/"/g, "'"),
                email: user?.email ?? "",
                purchaseDate: new Date(p.purchaseDate).toLocaleDateString("en-IN"),
                amount: p.amountPaid,
                orderId: p.razorpayOrderId ?? "",
                licenseStatus,
            };
        });

        // Safe filename — no special characters
        const safeTitle = (movie.title || "analytics")
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .slice(0, 50);

        if (format === "csv") {
            const header = "Name,Email,Purchase Date,Amount (Rs),Order ID,License Status\n";
            const csvRows = rows.map((r) =>
                `"${r.name}","${r.email}","${r.purchaseDate}",${r.amount},"${r.orderId}","${r.licenseStatus}"`
            );
            const csv = header + csvRows.join("\n");

            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}-analytics.csv"`);
            return res.send(csv);
        }

        if (format === "excel") {
            // Safe worksheet name — max 31 chars, no special chars
            const wsName = (movie.title || "Analytics")
                .replace(/[^a-zA-Z0-9\s]/g, "")
                .trim()
                .slice(0, 31) || "Analytics";

            const xmlRows = rows.map((r) => `
                <Row>
                    <Cell><Data ss:Type="String">${r.name}</Data></Cell>
                    <Cell><Data ss:Type="String">${r.email}</Data></Cell>
                    <Cell><Data ss:Type="String">${r.purchaseDate}</Data></Cell>
                    <Cell><Data ss:Type="Number">${r.amount}</Data></Cell>
                    <Cell><Data ss:Type="String">${r.orderId}</Data></Cell>
                    <Cell><Data ss:Type="String">${r.licenseStatus}</Data></Cell>
                </Row>`).join("");

            const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${wsName}">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Name</Data></Cell>
        <Cell><Data ss:Type="String">Email</Data></Cell>
        <Cell><Data ss:Type="String">Purchase Date</Data></Cell>
        <Cell><Data ss:Type="String">Amount (Rs)</Data></Cell>
        <Cell><Data ss:Type="String">Order ID</Data></Cell>
        <Cell><Data ss:Type="String">License Status</Data></Cell>
      </Row>
      ${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`;

            res.setHeader("Content-Type", "application/vnd.ms-excel");
            res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}-analytics.xlsx"`);
            return res.send(xml);
        }

        res.status(400).json({ success: false, message: "format must be csv or excel" });
    } catch (error: any) {
        console.error("Export error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};