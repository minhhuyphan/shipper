/**
 * Global Error Handler
 * Chức năng: Tập trung xử lý tất cả các lỗi xảy ra trong ứng dụng và trả về phản hồi chuẩn API.
 */
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
};
