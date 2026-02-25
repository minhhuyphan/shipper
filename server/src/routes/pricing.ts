import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pricingService } from '../services/pricingService';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
    try {
        const configs = await pricingService.list();
        res.json(configs);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get('/active', async (_req: Request, res: Response) => {
    try {
        const config = await pricingService.getActive();
        res.json(config);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

const pricingSchema = z.object({
    baseFare: z.number().min(0),
    baseDistanceKm: z.number().min(0),
    pricePerKm: z.number().min(0),
    peakHourSurcharge: z.object({
        startHour: z.number().min(0).max(23),
        endHour: z.number().min(0).max(23),
        fee: z.number().min(0),
    }).optional(),
    bulkyItemSurcharge: z.number().min(0).optional(),
    codFee: z.object({
        type: z.enum(['fixed', 'percentage']),
        value: z.number().min(0),
    }).optional(),
    services: z.object({
        express: z.object({ enabled: z.boolean(), multiplier: z.number() }).optional(),
        economy: z.object({ enabled: z.boolean(), multiplier: z.number() }).optional(),
    }).optional(),
});

router.post('/', validate(pricingSchema), async (req: AuthRequest, res: Response) => {
    try {
        const config = await pricingService.create(req.body, req.user._id.toString());
        res.status(201).json(config);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const config = await pricingService.update(req.params.id, req.body, req.user._id.toString());
        res.json(config);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.post('/:id/activate', async (req: AuthRequest, res: Response) => {
    try {
        const config = await pricingService.activate(req.params.id, req.user._id.toString());
        res.json(config);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

const simulateSchema = z.object({
    distanceKm: z.number().min(0),
    serviceType: z.enum(['express', 'economy']),
    isBulky: z.boolean(),
    codAmount: z.number().min(0),
    timestamp: z.string(),
});

router.post('/simulate', validate(simulateSchema), async (req: Request, res: Response) => {
    try {
        const result = await pricingService.simulate(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
