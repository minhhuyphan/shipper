import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: result.error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            });
            return;
        }
        req.body = result.data;
        next();
    };
};

export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            res.status(400).json({
                error: 'Query validation failed',
                details: result.error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            });
            return;
        }
        req.query = result.data;
        next();
    };
};
