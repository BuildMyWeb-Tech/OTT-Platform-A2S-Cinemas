import mongoose, { Schema, Document } from "mongoose";

export interface IAppConfig extends Document {
    key: string;
    latestVersion: string;
    minVersion: string;
    updateMessage: string;
}

const appConfigSchema = new Schema<IAppConfig>(
    {
        key: { type: String, required: true, unique: true, default: "singleton" },
        latestVersion: { type: String, required: true, default: "1.0.0" },
        minVersion: { type: String, required: true, default: "1.0.0" },
        updateMessage: { type: String, default: "A new version of A2S Cinemas is available. Please update to continue." },
    },
    { timestamps: true }
);

export default mongoose.model<IAppConfig>("AppConfig", appConfigSchema);
