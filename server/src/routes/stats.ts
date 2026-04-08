/**
 * Route: Stats
 * Chức năng: Cung cấp các số liệu thống kê cho trang Dashboard.
 * Các thành phần chính: Báo cáo doanh thu, Tổng hợp đơn hàng, Danh sách tài xế trực tuyến.
 */
import { Router, Request, Response } from 'express';
import { statsService } from '../services/statsService';
import { driverService } from '../services/driverService';

const router = Router();

router.get('/revenue', async (req: Request, res: Response) => {
    try {
        const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = req.query.to ? new Date(req.query.to as string) : new Date();
        const groupBy = (req.query.groupBy as string) || 'day';
        const result = await statsService.getRevenue(from, to, groupBy);
        res.json(result);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get('/orders-summary', async (req: Request, res: Response) => {
    try {
        const from = req.query.from ? new Date(req.query.from as string) : undefined;
        const to = req.query.to ? new Date(req.query.to as string) : undefined;
        const result = await statsService.getOrdersSummary(from, to);
        res.json(result);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get('/drivers/online', async (_req: Request, res: Response) => {
    try {
        const result = await driverService.getOnline();
        res.json(result);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
