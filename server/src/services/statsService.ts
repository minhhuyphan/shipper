import { Order } from '../models';

export class StatsService {
    async getRevenue(from: Date, to: Date, groupBy: string) {
        const matchStage: any = {
            status: 'completed',
            createdAt: { $gte: from, $lte: to },
        };

        let dateFormat: string;
        switch (groupBy) {
            case 'week':
                dateFormat = '%Y-W%V';
                break;
            case 'month':
                dateFormat = '%Y-%m';
                break;
            default:
                dateFormat = '%Y-%m-%d';
        }

        const result = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    revenue: { $sum: '$pricingBreakdown.total' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { date: '$_id', revenue: 1, count: 1, _id: 0 } },
        ]);

        return result;
    }

    async getOrdersSummary(from?: Date, to?: Date) {
        const matchStage: any = {};
        if (from && to) {
            matchStage.createdAt = { $gte: from, $lte: to };
        }

        const result = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const summary: Record<string, number> = {
            pending: 0,
            assigned: 0,
            picking_up: 0,
            delivering: 0,
            completed: 0,
            cancelled: 0,
        };

        result.forEach((r) => {
            summary[r._id] = r.count;
        });

        const running = summary.pending + summary.assigned + summary.picking_up + summary.delivering;

        return {
            running,
            completed: summary.completed,
            cancelled: summary.cancelled,
            total: running + summary.completed + summary.cancelled,
            breakdown: summary,
        };
    }
}

export const statsService = new StatsService();
