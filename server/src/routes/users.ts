import { Router, Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/authService";
import { validate } from "../middleware/validate";
import { AuthRequest, auth } from "../middleware/auth";

const router = Router();

// Change password for authenticated user
const changePasswordSchema = z
  .object({
    oldPassword: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
  })
  .refine(
    (data) => data.oldPassword || data.currentPassword,
    "Either oldPassword or currentPassword is required",
  )
  .transform((data) => ({
    oldPassword: data.oldPassword || data.currentPassword || "",
    newPassword: data.newPassword,
  }));

// PATCH /:id/change-password - Change password via user ID path
router.patch(
  "/:id/change-password",
  auth,
  validate(changePasswordSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      // Verify the user is changing their own password or is an admin
      if (req.params.id !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          error: "You can only change your own password",
        });
        return;
      }

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

// GET /:id - Get user profile
router.get("/:id", auth, async (req: AuthRequest, res: Response) => {
  try {
    // Verify the user is getting their own profile or is an admin
    if (req.params.id !== req.user._id.toString()) {
      res.status(403).json({
        success: false,
        error: "You can only view your own profile",
      });
      return;
    }

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

// PATCH /:id - Update user (general update endpoint)
const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  oldPassword: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

router.patch(
  "/:id",
  auth,
  validate(updateUserSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (req.params.id !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          error: "You can only update your own profile",
        });
        return;
      }

      // If password change is requested
      if (req.body.newPassword) {
        const oldPassword = req.body.oldPassword || req.body.currentPassword;
        if (!oldPassword) {
          res.status(400).json({
            success: false,
            error: "Current password is required to change password",
          });
          return;
        }

        const result = await authService.changePassword(
          req.user._id.toString(),
          oldPassword,
          req.body.newPassword,
        );

        res.json({
          success: true,
          message: "Profile updated successfully",
          data: result,
        });
      } else {
        res.json({
          success: true,
          message: "Profile updated successfully",
          data: req.user,
        });
      }
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// GET /profile/me - Get current user profile
router.get("/profile/me", auth, async (req: AuthRequest, res: Response) => {
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
