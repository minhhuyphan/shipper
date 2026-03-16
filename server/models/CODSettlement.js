"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CODSettlement = void 0;
const mongoose_1 = require("mongoose");
const codSettlementSchema = new mongoose_1.Schema({
    driver: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'bank'], required: true },
    note: { type: String, default: '' },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
exports.CODSettlement = mongoose_1.default.model('CODSettlement', codSettlementSchema);
