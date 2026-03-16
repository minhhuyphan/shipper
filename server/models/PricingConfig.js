"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingConfig = void 0;
const mongoose_1 = require("mongoose");
const pricingConfigSchema = new mongoose_1.Schema({
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
    codFee: mongoose_1.Schema.Types.Mixed, // Support both fixed amount and object
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
            performedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
            performedAt: { type: Date, default: Date.now },
            changes: mongoose_1.Schema.Types.Mixed,
        },
    ],
}, { timestamps: true });
exports.PricingConfig = mongoose_1.default.model("PricingConfig", pricingConfigSchema);
