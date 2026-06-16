import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";

// Same as protect, but never blocks the request — populates req.user if a
// valid token is present, otherwise proceeds as a guest (req.user stays undefined).
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : null;

        if (!token) return next();

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        const user = await User.findById(decoded.id).select("-password");

        if (user && !user.isBlocked) {
            req.user = user;
        }
    } catch {
        // invalid/expired token — proceed as guest, don't block
    }
    next();
};