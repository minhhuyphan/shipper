/**
 * Model: CODSettlement
 * Chức năng: Ghi lại các giao dịch đối soát tiền COD (thu hộ) giữa tài xế và công ty.
 * Các thành phần chính: Driver, Amount (số tiền), Method (tiền mặt/chuyển khoản), Người tạo giao dịch.
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICODSettlement extends Document {
    driver: Types.ObjectId;
    amount: number;
    method: 'cash' | 'bank';
    note: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
}

const codSettlementSchema = new Schema<ICODSettlement>(
    {
        driver: { type: Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
        amount: { type: Number, required: true },
        method: { type: String, enum: ['cash', 'bank'], required: true },
        note: { type: String, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

export const CODSettlement = mongoose.model<ICODSettlement>('CODSettlement', codSettlementSchema);
