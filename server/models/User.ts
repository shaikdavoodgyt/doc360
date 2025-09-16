import mongoose, { Schema, Types } from "mongoose";

export type UserRole = "admin" | "customer";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  pwdHash: string;
  role: UserRole;
  customerId?: Types.ObjectId | null;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    pwdHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "customer"], required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
