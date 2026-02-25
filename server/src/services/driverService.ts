import { Driver, CODSettlement, Order } from '../models';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

export class DriverService {
    async list(query: { page?: number; limit?: number; status?: string; search?: string; locked?: string }) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query.status) filter.status = query.status;
        if (query.locked !== undefined) filter.locked = query.locked === 'true';
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: 'i' } },
                { phone: { $regex: query.search, $options: 'i' } },
                { vehiclePlate: { $regex: query.search, $options: 'i' } },
            ];
        }

        const [drivers, total] = await Promise.all([
            Driver.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Driver.countDocuments(filter),
        ]);

        return {
            drivers,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }

    async getById(id: string) {
        const driver = await Driver.findById(id).lean();
        if (!driver) throw new AppError('Driver not found', 404);
        return driver;
    }

    async getOnline() {
        return Driver.find({ online: true, status: 'approved' })
            .select('name phone lastLocation vehiclePlate')
            .lean();
    }

    async approve(id: string, action: 'approved' | 'rejected') {
        const driver = await Driver.findById(id);
        if (!driver) throw new AppError('Driver not found', 404);
        driver.status = action;
        await driver.save();
        return driver;
    }

    async toggleLock(id: string) {
        const driver = await Driver.findById(id);
        if (!driver) throw new AppError('Driver not found', 404);
        driver.locked = !driver.locked;
        if (driver.locked) driver.online = false;
        await driver.save();
        return driver;
    }

    async getCodSummary() {
        const drivers = await Driver.find({ codHolding: { $gt: 0 } })
            .select('name phone codHolding vehiclePlate')
            .sort({ codHolding: -1 })
            .lean();
        const totalHolding = drivers.reduce((sum, d) => sum + d.codHolding, 0);
        return { drivers, totalHolding };
    }

    async settle(data: { driverId: string; amount: number; method: string; note: string }, userId: string) {
        const driver = await Driver.findById(data.driverId);
        if (!driver) throw new AppError('Driver not found', 404);
        if (data.amount > driver.codHolding) throw new AppError('Settlement amount exceeds COD holding', 400);

        driver.codHolding -= data.amount;
        await driver.save();

        const settlement = new CODSettlement({
            driver: new mongoose.Types.ObjectId(data.driverId),
            amount: data.amount,
            method: data.method,
            note: data.note,
            createdBy: new mongoose.Types.ObjectId(userId),
        });

        await settlement.save();
        return settlement;
    }

    async getSettlements(query: { page?: number; limit?: number; driverId?: string }) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query.driverId) filter.driver = query.driverId;

        const [settlements, total] = await Promise.all([
            CODSettlement.find(filter)
                .populate('driver', 'name phone')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            CODSettlement.countDocuments(filter),
        ]);

        return {
            settlements,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }

    async exportCsv() {
        const settlements = await CODSettlement.find()
            .populate('driver', 'name phone')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const header = 'Date,Driver,Phone,Amount,Method,Note,Created By\n';
        const rows = settlements.map((s: any) => {
            return `${new Date(s.createdAt).toISOString()},${s.driver?.name || ''},${s.driver?.phone || ''},${s.amount},${s.method},${s.note},${s.createdBy?.name || ''}`;
        });

        return header + rows.join('\n');
    }
}

export const driverService = new DriverService();
