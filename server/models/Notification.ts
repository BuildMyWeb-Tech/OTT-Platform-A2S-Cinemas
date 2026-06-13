import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    title: string;
    message: string;
    movieId?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        title: { type: String, required: true },
        message: { type: String, required: true },
        movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
    },
    { timestamps: true }
);

const Notification = mongoose.model<INotification>("Notification", notificationSchema);
export default Notification;