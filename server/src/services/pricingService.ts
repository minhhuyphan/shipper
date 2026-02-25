import { PricingConfig } from '../models';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

export class PricingService {
    async list() {
        return PricingConfig.find().sort({ version: -1 }).lean();
    }

    async getActive() {
        const config = await PricingConfig.findOne({ active: true }).lean();
        if (!config) throw new AppError('No active pricing configuration', 404);
        return config;
    }

    async create(data: any, userId: string) {
        const latest = await PricingConfig.findOne().sort({ version: -1 });
        const version = latest ? latest.version + 1 : 1;

        const config = new PricingConfig({
            ...data,
            version,
            active: false,
            auditLogs: [
                {
                    action: 'created',
                    performedBy: new mongoose.Types.ObjectId(userId),
                    performedAt: new Date(),
                },
            ],
        });

        await config.save();
        return config;
    }

    async update(id: string, data: any, userId: string) {
        const config = await PricingConfig.findById(id);
        if (!config) throw new AppError('Pricing config not found', 404);

        config.auditLogs.push({
            action: 'updated',
            performedBy: new mongoose.Types.ObjectId(userId),
            performedAt: new Date(),
            changes: data,
        });

        Object.assign(config, data);
        await config.save();
        return config;
    }

    async activate(id: string, userId: string) {
        await PricingConfig.updateMany({}, { active: false });

        const config = await PricingConfig.findById(id);
        if (!config) throw new AppError('Pricing config not found', 404);

        config.active = true;
        config.auditLogs.push({
            action: 'activated',
            performedBy: new mongoose.Types.ObjectId(userId),
            performedAt: new Date(),
        });

        await config.save();
        return config;
    }

    async simulate(input: {
        distanceKm: number;
        serviceType: 'express' | 'economy';
        isBulky: boolean;
        codAmount: number;
        timestamp: string;
    }) {
        const config = await PricingConfig.findOne({ active: true });
        if (!config) throw new AppError('No active pricing configuration', 404);

        const service = config.services[input.serviceType];
        if (!service || !service.enabled) {
            throw new AppError(`Service type "${input.serviceType}" is disabled`, 400);
        }

        // Base fare
        const baseFare = config.baseFare;

        // Distance charge
        const extraKm = Math.max(0, input.distanceKm - config.baseDistanceKm);
        const distanceCharge = extraKm * config.pricePerKm;

        // Peak hour surcharge
        const hour = new Date(input.timestamp).getHours();
        let peakHourSurcharge = 0;
        if (hour >= config.peakHourSurcharge.startHour && hour < config.peakHourSurcharge.endHour) {
            peakHourSurcharge = config.peakHourSurcharge.fee;
        }

        // Bulky surcharge
        const bulkyItemSurcharge = input.isBulky ? config.bulkyItemSurcharge : 0;

        // COD fee
        let codFee = 0;
        if (input.codAmount > 0) {
            codFee =
                config.codFee.type === 'percentage'
                    ? (input.codAmount * config.codFee.value) / 100
                    : config.codFee.value;
        }

        // Service multiplier
        const subtotal = (baseFare + distanceCharge + peakHourSurcharge + bulkyItemSurcharge) * service.multiplier;
        const total = subtotal + codFee;

        return {
            input,
            breakdown: {
                baseFare,
                distanceCharge: Math.round(distanceCharge),
                peakHourSurcharge,
                bulkyItemSurcharge,
                serviceMultiplier: service.multiplier,
                subtotal: Math.round(subtotal),
                codFee: Math.round(codFee),
                total: Math.round(total),
            },
            configVersion: config.version,
        };
    }
}

export const pricingService = new PricingService();
