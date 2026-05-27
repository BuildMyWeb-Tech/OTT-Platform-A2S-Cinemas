// server/models/User.ts
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../types/index.js";

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        password: { type: String, required: true, minlength: 6 },
        image: { type: String },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        isBlocked: { type: Boolean, default: false },
        purchasedMovies: [{ type: Schema.Types.ObjectId, ref: "Movie" }],
    },
    { timestamps: true }
);

// CRITICAL FIX — only hash when password field is actually modified
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    // Only hash if not already hashed (bcrypt hashes start with $2b$)
    if (this.password.startsWith("$2b$") || this.password.startsWith("$2a$")) return;
    this.password = await bcrypt.hash(this.password as string, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;