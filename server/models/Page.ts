import mongoose, { Schema, Types } from "mongoose";

export interface IPage {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  folderId?: string | null;
  title: string;
  slug: string;
  contentHtml: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    folderId: { type: String, default: null },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    contentHtml: { type: String, default: "" },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PageSchema.index({ productId: 1, slug: 1 }, { unique: true });

export const Page = mongoose.models.Page || mongoose.model<IPage>("Page", PageSchema);
