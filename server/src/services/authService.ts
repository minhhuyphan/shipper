import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
    async login(email: string, password: string) {
        const user = await User.findOne({ email });
        if (!user) throw new AppError('Invalid credentials', 401);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new AppError('Invalid credentials', 401);

        const token = jwt.sign({ id: user._id, role: user.role }, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn as string,
        } as jwt.SignOptions);

        return {
            token,
            user: { id: user._id, email: user.email, name: user.name, role: user.role },
        };
    }
}

export const authService = new AuthService();
