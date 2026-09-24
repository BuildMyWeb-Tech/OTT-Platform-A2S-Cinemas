import { Request, Response } from "express";
import AppConfig from "../models/AppConfig.js";

// ── GET /api/config/version — public, checked by the app on launch ────────────
export const getVersionConfig = async (req: Request, res: Response) => {
    try {
        let config = await AppConfig.findOne({ key: "singleton" });
        if (!config) config = await AppConfig.create({ key: "singleton" });
        res.json({
            success: true,
            data: {
                latestVersion: config.latestVersion,
                minVersion: config.minVersion,
                updateMessage: config.updateMessage,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PATCH /api/admin/app-config — admin sets the version after a Play Store release
export const updateVersionConfig = async (req: Request, res: Response) => {
    try {
        const { latestVersion, minVersion, updateMessage } = req.body;
        const updateData: any = {};
        if (latestVersion !== undefined) updateData.latestVersion = String(latestVersion).trim();
        if (minVersion !== undefined) updateData.minVersion = String(minVersion).trim();
        if (updateMessage !== undefined) updateData.updateMessage = String(updateMessage).trim();

        const config = await AppConfig.findOneAndUpdate(
            { key: "singleton" },
            { $set: updateData },
            { new: true, upsert: true }
        );
        res.json({ success: true, data: config });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
