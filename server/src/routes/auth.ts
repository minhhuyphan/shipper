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
