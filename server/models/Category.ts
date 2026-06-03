import mongoose, { Schema, Document, CallbackError } from "mongoose";

export interface ICategory extends Document {
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            unique: true,
            trim: true,
            maxlength: [50, "Name cannot exceed 50 characters"],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, "Description cannot exceed 200 characters"],
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Auto-generate slug from name before saving
categorySchema.pre("save", async function (this: mongoose.HydratedDocument<ICategory>) {
    if (this.isModified("name")) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    }
});

categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

const Category = mongoose.model<ICategory>("Category", categorySchema);
export default Category;