import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { uploadToS3 } from "../config/s3.js";
import { v4 as uuidv4 } from "uuid";

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB for videos
    fileFilter: (_req, file, cb) => {
        if (file.fieldname === "poster") {
            cb(null, file.mimetype.startsWith("image/"));
        } else if (file.fieldname === "video") {
            cb(null, file.mimetype.startsWith("video/"));
        } else {
            cb(null, true);
        }
    },
});

// Middleware: upload poster to S3 public, attach posterUrl to req.body
export const uploadPoster = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file && req.files && (req.files as any).poster) {
        req.file = (req.files as any).poster[0];
    }
    if (!req.file) return next();
    try {
        const ext = req.file.originalname.split(".").pop();
        const key = `posters/${uuidv4()}.${ext}`;
        const url = await uploadToS3(req.file.buffer, key, req.file.mimetype, true);
        req.body.poster = url;
        next();
    } catch (err: any) {
        res.status(500).json({ success: false, message: "Poster upload failed: " + err.message });
    }
};

// Middleware: upload video to S3 private, attach videoKey to req.body
export const uploadVideo = async (req: Request, res: Response, next: NextFunction) => {
    const videoFile = req.files && (req.files as any).video ? (req.files as any).video[0] : null;
    if (!videoFile) return next();
    try {
        const ext = videoFile.originalname.split(".").pop();
        const key = `videos/${uuidv4()}.${ext}`;
        await uploadToS3(videoFile.buffer, key, videoFile.mimetype, false);
        req.body.videoKey = key; // private key, not public URL
        next();
    } catch (err: any) {
        res.status(500).json({ success: false, message: "Video upload failed: " + err.message });
    }
};

export default upload;