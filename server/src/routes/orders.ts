import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { orderService } from '../services/orderService';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await orderService.list({
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            status: req.query.status as string,
            search: req.query.search as string,
            from: req.query.from as string,
            to: req.query.to as string,
        });
        res.json(result);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const order = await orderService.getById(req.params.id);
        res.json(order);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

const updateOrderSchema = z.object({
    status: z.enum(['pending', 'assigned', 'picking_up', 'delivering', 'completed', 'cancelled']).optional(),
    codAmount: z.number().optional(),
}).passthrough();

router.patch('/:id', validate(updateOrderSchema), async (req: AuthRequest, res: Response) => {
    try {
        const order = await orderService.update(req.params.id, req.body, req.user._id.toString());
        res.json(order);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

const complaintSchema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'rejected']),
    note: z.string().optional(),
});

router.patch('/:id/complaint', validate(complaintSchema), async (req: AuthRequest, res: Response) => {
    try {
        const order = await orderService.updateComplaint(req.params.id, req.body, req.user._id.toString());
        res.json(order);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get('/:id/audit', async (req: Request, res: Response) => {
    try {
        const logs = await orderService.getAuditLogs(req.params.id);
        res.json(logs);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
