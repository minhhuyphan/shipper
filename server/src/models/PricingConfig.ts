/**
 * Model: PricingConfig
 * Chức năng: Quản lý cấu hình giá cước vận chuyển, phí COD, phụ phí giờ cao điểm và đồ cồng kềnh.
 * Các thành phần chính: Giá mở cửa (baseFare), Giá theo km, Hệ số dịch vụ (Express/Economy), Lịch sử thay đổi (Audit).
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IPeakHourSurcharge {
  startHour: number;
  endHour: number;
  fee: number;
}

export interface ICodFee {
  type: "fixed" | "percentage";
  value: number;
}

export interface IPricingConfig extends Document {
  version: number;
  baseFare: number;
  baseDistanceKm: number;
  pricePerKm: number;
  peakHourSurcharge: IPeakHourSurcharge;
  peakHourSurchargePercent?: number; // Percentage for peak hour surcharge (default 20%)
  bulkyItemSurcharge: number;
  codFee: ICodFee | number; // Support both fixed amount and percentage object
  services: {
    express: { enabled: boolean; multiplier: number };
    economy: { enabled: boolean; multiplier: number };
  };
  active: boolean;
  auditLogs: {
    action: string;
    performedBy: mongoose.Types.ObjectId;
    performedAt: Date;
    changes?: any;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const pricingConfigSchema = new Schema<IPricingConfig>(
  {
    version: { type: Number, required: true },
    baseFare: { type: Number, required: true },
    baseDistanceKm: { type: Number, required: true, default: 2 },
    pricePerKm: { type: Number, required: true },
    peakHourSurcharge: {
      startHour: { type: Number, default: 7 },
      endHour: { type: Number, default: 9 },
      fee: { type: Number, default: 0 },
    },
    peakHourSurchargePercent: { type: Number, default: 20 }, // Default 20% peak surcharge
    bulkyItemSurcharge: { type: Number, default: 0 },
    codFee: Schema.Types.Mixed, // Support both fixed amount and object
    services: {
      express: {
        enabled: { type: Boolean, default: true },
        multiplier: { type: Number, default: 1.3 },
      },
      economy: {
        enabled: { type: Boolean, default: true },
        multiplier: { type: Number, default: 1.0 },
      },
    },
    active: { type: Boolean, default: false, index: true },
    auditLogs: [
      {
        action: String,
        performedBy: { type: Schema.Types.ObjectId, ref: "User" },
        performedAt: { type: Date, default: Date.now },
        changes: Schema.Types.Mixed,
      },
    ],
  },
  { timestamps: true },
);

export const PricingConfig = mongoose.model<IPricingConfig>(
  "PricingConfig",
  pricingConfigSchema,
);
