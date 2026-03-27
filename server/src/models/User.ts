import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  phone?: string;
  password: string;
  name: string;
  role: "admin" | "staff" | "customer" | "driver";
  resetTokenHash?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "staff", "customer", "driver"], default: "staff" },
    resetTokenHash: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", userSchema);
