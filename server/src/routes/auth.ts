import { Router, Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/authService";
import { validate } from "../middleware/validate";
import { AuthRequest, auth } from "../middleware/auth";

const router = Router();

const loginSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(1),
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone is required",
  });

router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await authService.login(
        req.body.email,
        req.body.phone,
        req.body.password,
      );
      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },
);

// Signup endpoint
const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

router.post(
  "/signup",
  validate(signupSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await authService.signup(
        req.body.email,
        req.body.password,
        req.body.name,
        req.body.phone,
        "customer",
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },
);

// Change password endpoint
const changePasswordSchema = z
  .object({
    oldPassword: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
  })
  .refine(
    (data) => data.oldPassword || data.currentPassword,
    "Either oldPassword or currentPassword is required"
  )
  .transform((data) => ({
    oldPassword: data.oldPassword || data.currentPassword || "",
    newPassword: data.newPassword,
  }));

router.post(
  "/change-password",
  auth,
  validate(changePasswordSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await authService.changePassword(
        req.user._id.toString(),
        req.body.oldPassword,
        req.body.newPassword,
      );
      res.json({
        success: true,
        message: "Password changed successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// Forgot password endpoint
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        ok: false,
        message: "Nếu tài khoản tồn tại, email đặt lại mật khẩu đã được gửi.",
      });
    }
  },
);

// Reset password endpoint
const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await authService.resetPassword(
        req.body.email,
        req.body.token,
        req.body.newPassword,
      );
      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        ok: false,
        error: error.message,
      });
    }
  },
);

router.get("/me", auth, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
