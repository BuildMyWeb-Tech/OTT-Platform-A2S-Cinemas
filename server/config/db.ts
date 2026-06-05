import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log("MongoDB already connected");
            return;
        }

        mongoose.connection.on("connected", () => {
            console.log("MongoDB connected");
        });

        mongoose.connection.on("error", (err) => {
            console.error("MongoDB error:", err);
        });

        await mongoose.connect(process.env.MONGODB_URI as string, {
            serverSelectionTimeoutMS: 5000,
        });

    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;