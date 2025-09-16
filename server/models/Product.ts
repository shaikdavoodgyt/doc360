import mongoose, { Schema, Types } from "mongoose";

export interface IProduct {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  name: string;
  slug: string;
  desc?: string;
  published: boolean;
  publishedUrl?: string | null;
  rootStructure?: any;
  publishedHtml?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    desc: { type: String },
    published: { type: Boolean, default: false },
    publishedUrl: { type: String, default: null },
    rootStructure: { type: Schema.Types.Mixed },
    publishedHtml: { type: String, default: null },
  },
  { timestamps: true }
);

ProductSchema.index({ customerId: 1, slug: 1 }, { unique: true });

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
