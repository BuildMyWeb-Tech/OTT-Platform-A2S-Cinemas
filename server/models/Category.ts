import mongoose, { Schema } from "mongoose";

export interface ICategory {
    name: string;
    description?: string;
    isActive: boolean;
}

const categorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true, unique: true, trim: true },
        description: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Category = mongoose.model<ICategory>("Category", categorySchema);
export default Category;