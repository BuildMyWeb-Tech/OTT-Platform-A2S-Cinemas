import mongoose, { Schema, Document } from "mongoose";

export interface IOTP extends Document {
    identifier: string;   // phone number or email
    type: "phone" | "email";
    otp: string;
    purpose: "login" | "register";
    name?: string;        // stored for register flow
    verified: boolean;
    attempts: number;
    expiresAt: Date;
    createdAt: Date;
}

const OTPSchema = new Schema<IOTP>({
    identifier: { type: String, required: true, lowercase: true, trim: true },
    type: { type: String, enum: ["phone", "email"], required: true },
    otp: { type: String, required: true },
    purpose: { type: String, enum: ["login", "register"], required: true },
    name: { type: String },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Auto-delete expired OTPs from MongoDB
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Prevent duplicate OTPs for same identifier
OTPSchema.index({ identifier: 1, type: 1 });

const OTP = mongoose.model<IOTP>("OTP", OTPSchema);
export default OTP;