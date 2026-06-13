import { Request, Response } from "express";
import Notification from "../models/Notification.js";

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ success: true, data: notifications });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};