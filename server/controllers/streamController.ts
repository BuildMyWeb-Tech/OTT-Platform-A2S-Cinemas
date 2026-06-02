import { Request, Response } from "express";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import fs from "fs";
import path from "path";
import License from "../models/License.js";
import Movie from "../models/Movie.js";

// Load CloudFront private key once at startup
let cloudFrontPrivateKey: string = "";

function getPrivateKey(): string {
  if (cloudFrontPrivateKey) return cloudFrontPrivateKey;

  // Try reading from file path first
  const keyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH;
  if (keyPath) {
    const fullPath = path.resolve(keyPath);
    if (fs.existsSync(fullPath)) {
      cloudFrontPrivateKey = fs.readFileSync(fullPath, "utf8");
      return cloudFrontPrivateKey;
    }
  }

  // Fallback: key stored directly in env (for Render/Vercel deploy)
  const envKey = process.env.CLOUDFRONT_PRIVATE_KEY;
  if (envKey) {
    // Replace literal \n with real newlines (env vars can't have real newlines)
    cloudFrontPrivateKey = envKey.replace(/\\n/g, "\n");
    return cloudFrontPrivateKey;
  }

  throw new Error("CloudFront private key not found. Set CLOUDFRONT_PRIVATE_KEY_PATH or CLOUDFRONT_PRIVATE_KEY in .env");
}

export const streamMovie = async (req: Request, res: Response) => {
  try {
    const { movieId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // Check license
    const now = new Date();
    const license = await License.findOne({
      user: userId,
      movie: movieId,
      isRevoked: false,
      expiryDate: { $gt: now },
    });

    if (!license) {
      return res.status(403).json({
        success: false,
        message: "No active license for this movie",
        code: "LICENSE_REQUIRED",
      });
    }

    // Get movie to find video key
    const movie = await Movie.findById(movieId).select("+videoKey");
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    // Check if CloudFront is configured
    const cfDomain = process.env.CLOUDFRONT_DOMAIN;
    const cfKeyId = process.env.CLOUDFRONT_KEY_ID;

    if (!cfDomain || !cfKeyId) {
      // CloudFront not configured yet — fall back to trailer URL
      console.warn("CloudFront not configured — falling back to trailerUrl");
      if (movie.trailerUrl) {
        return res.json({
          success: true,
          data: {
            streamUrl: movie.trailerUrl,
            expiresAt: new Date(now.getTime() + 3600 * 1000).toISOString(),
            isTrailerFallback: true,
          },
        });
      }
      return res.status(503).json({
        success: false,
        message: "Streaming not configured yet",
      });
    }

    // Generate signed CloudFront URL
    const expiresSeconds = parseInt(process.env.CLOUDFRONT_SIGNED_URL_EXPIRES || "3600");
    const expiresAt = new Date(now.getTime() + expiresSeconds * 1000);

    const videoUrl = `https://${cfDomain}/${movie.videoKey}`;

    const privateKey = getPrivateKey();
    const signedUrl = getSignedUrl({
      url: videoUrl,
      keyPairId: cfKeyId,
      dateLessThan: expiresAt.toISOString(),
      privateKey,
    });

    // Update license last watched
    await License.findByIdAndUpdate(license._id, {
      lastWatched: now,
      $inc: { watchCount: 1 },
    });

    return res.json({
      success: true,
      data: {
        streamUrl: signedUrl,
        expiresAt: expiresAt.toISOString(),
        daysLeft: Math.max(0, Math.ceil((new Date(license.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
        isTrailerFallback: false,
      },
    });

  } catch (error: any) {
    console.error("Stream error:", error.message);

    // Mongoose CastError = invalid ObjectId (e.g. "notanid") → 400 not 500
    if (error.name === "CastError" || error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID format",
        code: "INVALID_ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to generate stream URL",
    });
  }
};