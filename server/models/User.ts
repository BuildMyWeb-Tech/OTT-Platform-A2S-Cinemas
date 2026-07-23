import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
    name: string;
    email: string;
    phone?: string;
    password: string;
    image?: string;
    role: "user" | "admin";
    isBlocked: boolean;
    purchasedMovies: mongoose.Types.ObjectId[];
    authMethod: "password" | "phone_otp" | "email_otp";
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        phone: { type: String, trim: true, sparse: true },
        password: { type: String, required: true },
        image: { type: String },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        isBlocked: { type: Boolean, default: false },
        purchasedMovies: [{ type: Schema.Types.ObjectId, ref: "Movie" }],
        authMethod: {
            type: String,
            enum: ["password", "phone_otp", "email_otp"],
            default: "password",
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    if (this.password.startsWith("$2b$") || this.password.startsWith("$2a$")) return;
    if (this.password.startsWith("otp_")) return; // placeholder for OTP users
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>("User", userSchema);