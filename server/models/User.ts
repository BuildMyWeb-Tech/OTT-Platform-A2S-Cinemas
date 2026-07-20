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
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        phone: { type: String, sparse: true, trim: true },
        password: { type: String, required: true, minlength: 6 },
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
    // Skip hashing placeholder passwords for OTP users
    if (this.password.startsWith("otp_")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;