/**
 * Authentication Middleware
 * Chức năng: Kiểm tra và xác thực JWT token trong header của các request bảo mật.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models';

export interface AuthRequest extends Request {
    user?: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'Access denied. No token provided.' });
            return;
        }

        const decoded = jwt.verify(token, config.jwtSecret) as any;
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            res.status(401).json({ error: 'Invalid token.' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

export const rbac = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
            return;
        }
        next();
    };
};
