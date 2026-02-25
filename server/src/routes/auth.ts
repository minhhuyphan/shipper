import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { validate } from '../middleware/validate';

const router = Router();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
    try {
        const result = await authService.login(req.body.email, req.body.password);
        res.json(result);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get('/me', async (req: Request, res: Response) => {
    // This will be used with auth middleware in the main router setup
    res.json({ user: (req as any).user });
});

export default router;
