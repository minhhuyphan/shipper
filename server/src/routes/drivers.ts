import { Router, Request, Response } from "express";
import { z } from "zod";
import { driverService } from "../services/driverService";
import { Order } from "../models";
import { validate } from "../middleware/validate";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// Driver CRUD
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await driverService.list({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
      search: req.query.search as string,
      locked: req.query.locked as string,
    });
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/:id/orders", async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ driver: req.params.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const driver = await driverService.getById(req.params.id);
    res.json(driver);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

const approveSchema = z.object({
  action: z.enum(["approved", "rejected"]),
});

router.patch(
  "/:id/approve",
  validate(approveSchema),
  async (req: Request, res: Response) => {
    try {
      const driver = await driverService.approve(
        req.params.id,
        req.body.action,
      );
      res.json(driver);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },
);

router.patch("/:id/lock", async (req: Request, res: Response) => {
  try {
    const driver = await driverService.toggleLock(req.params.id);
    res.json(driver);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.patch("/:id/profile", async (req: Request, res: Response) => {
  try {
    const driver = await driverService.updateProfile(req.params.id, req.body);
    res.json(driver);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// COD routes
router.get("/cod/summary", async (_req: Request, res: Response) => {
  try {
    const result = await driverService.getCodSummary();
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

const settleSchema = z.object({
  driverId: z.string(),
  amount: z.number().min(0),
  method: z.enum(["cash", "bank"]),
  note: z.string().optional().default(""),
});

router.post(
  "/cod/settle",
  validate(settleSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await driverService.settle(
        req.body,
        req.user._id.toString(),
      );
      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },
);

router.get("/cod/settlements", async (req: Request, res: Response) => {
  try {
    const result = await driverService.getSettlements({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      driverId: req.query.driverId as string,
    });
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/cod/export.csv", async (_req: Request, res: Response) => {
  try {
    const csv = await driverService.exportCsv();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=cod-settlements.csv",
    );
    res.send(csv);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
