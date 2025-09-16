import mongoose, { Schema, Types } from "mongoose";

export interface ICustomer {
  _id: Types.ObjectId;
  name: string;
  designation?: string;
  email: string;
  company?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    designation: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    company: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
