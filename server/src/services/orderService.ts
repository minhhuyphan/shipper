import { Order } from '../models';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

export class OrderService {
    async list(query: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
        from?: string;
        to?: string;
    }) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query.status) filter.status = query.status;
        if (query.search) {
            filter.$or = [
                { orderCode: { $regex: query.search, $options: 'i' } },
                { 'customer.name': { $regex: query.search, $options: 'i' } },
                { 'customer.phone': { $regex: query.search, $options: 'i' } },
            ];
        }
        if (query.from || query.to) {
            filter.createdAt = {};
            if (query.from) filter.createdAt.$gte = new Date(query.from);
            if (query.to) filter.createdAt.$lte = new Date(query.to);
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('driver', 'name phone vehiclePlate')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter),
        ]);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async getById(id: string) {
        const order = await Order.findById(id)
            .populate('driver', 'name phone vehiclePlate online')
            .lean();
        if (!order) throw new AppError('Order not found', 404);
        return order;
    }

    async update(id: string, updates: any, userId: string) {
        const order = await Order.findById(id);
        if (!order) throw new AppError('Order not found', 404);

        const auditEntries: any[] = [];
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'status' || key === 'codAmount') {
                auditEntries.push({
                    action: `updated_${key}`,
                    field: key,
                    oldValue: (order as any)[key],
                    newValue: value,
                    performedBy: new mongoose.Types.ObjectId(userId),
                    performedAt: new Date(),
                });
            }
        }

        Object.assign(order, updates);
        if (auditEntries.length > 0) {
            order.auditLogs.push(...auditEntries);
        }

        await order.save();
        return order;
    }

    async updateComplaint(id: string, complaint: { status: string; note?: string }, userId: string) {
        const order = await Order.findById(id);
        if (!order) throw new AppError('Order not found', 404);

        const oldStatus = order.complaint?.status || 'none';

        if (!order.complaint) {
            order.complaint = { status: complaint.status as any, notes: [], updatedAt: new Date() };
        } else {
            order.complaint.status = complaint.status as any;
            order.complaint.updatedAt = new Date();
        }

        if (complaint.note) {
            order.complaint.notes.push(complaint.note);
        }

        order.auditLogs.push({
            action: 'updated_complaint',
            field: 'complaint.status',
            oldValue: oldStatus,
            newValue: complaint.status,
            performedBy: new mongoose.Types.ObjectId(userId),
            performedAt: new Date(),
        });

        await order.save();
        return order;
    }

    async getAuditLogs(id: string) {
        const order = await Order.findById(id)
            .select('auditLogs orderCode')
            .populate('auditLogs.performedBy', 'name email')
            .lean();
        if (!order) throw new AppError('Order not found', 404);
        return order.auditLogs;
    }
}

export const orderService = new OrderService();
