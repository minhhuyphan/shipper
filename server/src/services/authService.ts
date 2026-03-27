import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models";
import { config } from "../config";
import { AppError } from "../middleware/errorHandler";
import { mailerService } from "./mailer";

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

  async signup(
    email: string,
    password: string,
    name: string,
    phone?: string,
    role: string = "customer",
  ) {
    // Validate input
    if (!email || !password || !name) {
      throw new AppError("Email, password, and name are required", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        throw new AppError("Email already registered", 409);
      }
      if (existingUser.phone === phone && phone) {
        throw new AppError("Phone number already registered", 409);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      phone: phone ? phone.trim() : undefined,
      role,
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpiresIn as string,
      } as jwt.SignOptions,
    );

    return {
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        phone: (newUser as any).phone,
        name: newUser.name,
        role: newUser.role,
      },
    };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
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

  async forgotPassword(email: string) {
    // Find user (but return generic response to avoid user enumeration)
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      // Generate random token (32 bytes = 64 hex chars)
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Hash token for storage
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Set expiry to 1 hour from now
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      // Save to database
      user.resetTokenHash = resetTokenHash;
      user.resetTokenExpiry = resetTokenExpiry;
      await user.save();

      // Build reset link (use CLIENT_URL from config)
      const resetLink = `${config.clientUrl}/reset-password?email=${encodeURIComponent(user.email)}&token=${resetToken}`;

      // Send email
      try {
        await mailerService.sendPasswordResetEmail({
          email: user.email,
          token: resetToken,
          resetLink,
        });
        console.log(`Password reset email sent to ${user.email}`);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Clear reset token if email fails
        user.resetTokenHash = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();
        throw new AppError(
          "Failed to send reset email. Please try again.",
          500,
        );
      }
    }

    // Always return generic response to prevent user enumeration
    return {
      ok: true,
      message: "Nếu tài khoản tồn tại, email đặt lại mật khẩu đã được gửi.",
    };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    // Validate input
    if (!email || !token || !newPassword) {
      throw new AppError("Email, token, and new password are required", 400);
    }

    if (newPassword.length < 6) {
      throw new AppError("New password must be at least 6 characters", 400);
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new AppError("Invalid request", 400);
    }

    // Check if reset token fields exist
    if (!user.resetTokenHash || !user.resetTokenExpiry) {
      throw new AppError("Invalid or expired token", 400);
    }

    // Check token expiry
    if (new Date() > user.resetTokenExpiry) {
      user.resetTokenHash = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();
      throw new AppError("Token has expired", 400);
    }

    // Verify token by comparing hashes
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (tokenHash !== user.resetTokenHash) {
      throw new AppError("Invalid token", 400);
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetTokenHash = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return {
      ok: true,
      message: "Password reset successfully",
    };
  }
}

export const authService = new AuthService();
