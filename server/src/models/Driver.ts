import mongoose, { Schema, Document } from "mongoose";

export interface IDriver extends Document {
  name: string;
  phone: string;
  vehiclePlate: string;
  vehicleType: string; // motorcycle, car, truck
  vehicleModel: string; // specific model
  status: "pending" | "approved" | "rejected";
  locked: boolean;
  documents: {
    idCardUrl: string;
    licenseUrl: string;
  };
  ratingAvg: number;
  totalRatings: number;
  online: boolean;
  lastOnlineToggleAt?: Date; // Track when online status was last changed
  lastLocation: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  codHolding: number;
  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new Schema<IDriver>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    vehiclePlate: { type: String, required: true },
    vehicleType: { type: String, default: "" },
    vehicleModel: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    locked: { type: Boolean, default: false },
    documents: {
      idCardUrl: { type: String, default: "" },
      licenseUrl: { type: String, default: "" },
    },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    online: { type: Boolean, default: false },
    lastOnlineToggleAt: { type: Date, default: null },
    lastLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now },
    },
    codHolding: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Driver = mongoose.model<IDriver>("Driver", driverSchema);
