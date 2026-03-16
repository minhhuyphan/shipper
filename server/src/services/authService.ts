import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { config } from "../config";
import { AppError } from "../middleware/errorHandler";

export class AuthService {
  async login(
    email: string | undefined,
    phone: string | undefined,
    password: string,
  ) {
    // Find user by email or phone
    const query = email ? { email } : { phone };
    const user = await User.findOne(query);
    if (!user) throw new AppError("Invalid credentials", 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError("Invalid credentials", 401);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpiresIn as string,
      } as jwt.SignOptions,
    );

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: (user as any).phone,
        name: user.name,
        role: user.role,
      },
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new AppError("Old password is incorrect", 401);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return {
      id: user._id,
      email: user.email,
      phone: (user as any).phone,
      name: user.name,
      role: user.role,
    };
  }
}

export const authService = new AuthService();
