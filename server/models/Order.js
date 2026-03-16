"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = require("mongoose");
const orderEventSchema = new mongoose_1.Schema({
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
}, { _id: false });
const complaintSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: ["open", "in_progress", "resolved", "rejected"],
        default: "open",
    },
    notes: [{ type: String }],
    updatedAt: { type: Date },
}, { _id: false });
const auditLogSchema = new mongoose_1.Schema({
    action: { type: String, required: true },
    field: { type: String },
    oldValue: { type: mongoose_1.Schema.Types.Mixed },
    newValue: { type: mongoose_1.Schema.Types.Mixed },
    performedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    performedAt: { type: Date, default: Date.now },
}, { _id: false });
const pricingBreakdownSchema = new mongoose_1.Schema({
    baseFare: { type: Number, required: true },
    distanceCharge: { type: Number, required: true },
    peakHourSurcharge: { type: Number, default: 0 },
    bulkyItemSurcharge: { type: Number, default: 0 },
    codFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
}, { _id: false });
const orderSchema = new mongoose_1.Schema({
    orderCode: { type: String, required: true, unique: true, index: true },
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
    },
    driver: { type: mongoose_1.Schema.Types.ObjectId, ref: "Driver" },
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
    deliveryProofImages: [{ type: String }],
    events: [orderEventSchema],
    complaint: complaintSchema,
    auditLogs: [auditLogSchema],
}, { timestamps: true });
exports.Order = mongoose_1.default.model("Order", orderSchema);
