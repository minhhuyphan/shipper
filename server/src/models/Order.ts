/**
 * Model: Order
 * Chức năng: Quản lý toàn bộ thông tin đơn hàng, lịch sử sự kiện, khiếu nại và nhật ký thay đổi (Audit Log).
 * Các thành phần chính: Schema Order, Interface IOrder, Định giá (PricingBreakdown), Trạng thái đơn hàng.
 */
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrderEvent {
  type: string;
  timestamp: Date;
  note?: string;
}

export interface IComplaint {
  status: "open" | "in_progress" | "resolved" | "rejected";
  notes: string[];
  updatedAt?: Date;
}

export interface IAuditLog {
  action: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
  performedBy: Types.ObjectId;
  performedAt: Date;
}

export interface IPricingBreakdown {
  baseFare: number;
  distanceCharge: number;
  peakHourSurcharge: number;
  bulkyItemSurcharge: number;
  codFee: number;
  total: number;
}

export interface IOrder extends Document {
  orderCode: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  recipient?: {
    name: string;
    phone: string;
  };
  driver?: Types.ObjectId;
  driverName?: string;
  driverPhone?: string;
  status:
    | "pending"
    | "assigned"
    | "picking_up"
    | "delivering"
    | "completed"
    | "cancelled";
  serviceType: "express" | "economy";
  pickupAddress: string;
  deliveryAddress: string;
  distanceKm: number;
  isBulky: boolean;
  pricingBreakdown: IPricingBreakdown;
  codAmount: number;
  codSettled: boolean;
  deliveryProofImages: string[];
  events: IOrderEvent[];
  complaint?: IComplaint;
  packagePhoto?: string;
  auditLogs: IAuditLog[];
  createdAt: Date;
  updatedAt: Date;
}

const orderEventSchema = new Schema<IOrderEvent>(
  {
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false },
);

const complaintSchema = new Schema<IComplaint>(
  {
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "rejected"],
      default: "open",
    },
    notes: [{ type: String }],
    updatedAt: { type: Date },
  },
  { _id: false },
);

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    field: { type: String },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    performedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const pricingBreakdownSchema = new Schema<IPricingBreakdown>(
  {
    baseFare: { type: Number, required: true },
    distanceCharge: { type: Number, required: true },
    peakHourSurcharge: { type: Number, default: 0 },
    bulkyItemSurcharge: { type: Number, default: 0 },
    codFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderCode: { type: String, required: true, unique: true, index: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },
    recipient: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    driver: { type: Schema.Types.ObjectId, ref: "Driver" },
    driverName: { type: String, default: "" },
    driverPhone: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "picking_up",
        "delivering",
        "completed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    serviceType: {
      type: String,
      enum: ["express", "economy"],
      default: "economy",
    },
    pickupAddress: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    distanceKm: { type: Number, required: true },
    isBulky: { type: Boolean, default: false },
    pricingBreakdown: { type: pricingBreakdownSchema, required: true },
    codAmount: { type: Number, default: 0 },
    codSettled: { type: Boolean, default: false, index: true },
    deliveryProofImages: [{ type: String }],
    packagePhoto: { type: String, default: "" },
    events: [orderEventSchema],
    complaint: complaintSchema,
    auditLogs: [auditLogSchema],
  },
  { timestamps: true },
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
