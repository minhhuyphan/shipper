"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Driver = void 0;
const mongoose_1 = require("mongoose");
const driverSchema = new mongoose_1.Schema({
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
    lastLocation: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
        updatedAt: { type: Date, default: Date.now },
    },
    codHolding: { type: Number, default: 0 },
}, { timestamps: true });
exports.Driver = mongoose_1.default.model("Driver", driverSchema);
