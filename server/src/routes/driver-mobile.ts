import { Router, Request, Response } from "express";
import { driverService } from "../services/driverService";
import { Driver, Order, User } from "../models";

const router = Router();

// Get driver profile (mobile)
// Can use either driver ID or phone number
router.get("/:id/profile", async (req: Request, res: Response) => {
  try {
    console.log("📱 Driver profile GET request:", {
      id: req.params.id,
    });

    let driver;
    // Try to find by ID first
    try {
      driver = await Driver.findById(req.params.id);
      if (driver) console.log("✅ Found driver by ID:", req.params.id);
    } catch (e: any) {
      console.log("⚠️  Driver ID not valid, trying phone lookup");
    }

    // If not found by ID, try to find user by ID and use their phone
    if (!driver) {
      try {
        const user = await User.findById(req.params.id);
        if (user && (user as any).phone) {
          console.log(
            "📞 Found user by ID, checking for driver with phone:",
            (user as any).phone,
          );
          driver = await Driver.findOne({ phone: (user as any).phone });
        }
      } catch (e: any) {
        console.log("⚠️  Could not find driver via user lookup:", e.message);
      }
    }

    // Final check
    if (!driver) {
      console.error("❌ Driver not found - ID:", req.params.id);
      return res.status(404).json({
        success: false,
        error: "Driver not found",
      });
    }

    console.log("✅ Returning driver profile:", driver._id);
    console.log(
      `📊 Current driver.online = ${(driver as any).online} (from database)`,
    );

    // Calculate income for mobile app
    const income = await driverService.calculateDriverIncome(
      driver._id.toString(),
    );

    const serverUpdateTime = (driver as any).lastOnlineToggleAt
      ? new Date((driver as any).lastOnlineToggleAt).getTime()
      : (driver as any).updatedAt?.getTime() || Date.now();

    res.json({
      success: true,
      data: {
        ...driver.toObject(),
        totalIncome: income.totalIncome,
        completedOrders: income.completedOrders,
      },
      serverOnline: driver.online,
      serverUpdateTime: serverUpdateTime,
    });
  } catch (error: any) {
    console.error("❌ Driver profile GET error:", error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// Driver self-service profile update (mobile)
// Can use either driver ID or phone number
router.patch("/:id/profile", async (req: Request, res: Response) => {
  try {
    console.log("📱 Driver profile update request:", {
      id: req.params.id,
      phone: req.body.phone,
      body: req.body,
    });

    let driver;
    // Try to find by ID first
    try {
      driver = await Driver.findById(req.params.id);
      if (driver) console.log("✅ Found driver by ID:", req.params.id);
    } catch (e: any) {
      console.log("⚠️  Driver ID not valid, trying phone lookup or create");
    }

    // If not found by ID, try to find user by ID and use their phone
    if (!driver) {
      try {
        const user = await User.findById(req.params.id);
        if (user && (user as any).phone) {
          console.log(
            "📞 Found user by ID, checking for driver with phone:",
            (user as any).phone,
          );
          driver = await Driver.findOne({ phone: (user as any).phone });

          // If driver not found, create one
          if (!driver) {
            console.log("🆕 Creating new driver for user:", user.name);
            driver = new Driver({
              name: user.name,
              phone: (user as any).phone,
              vehiclePlate: "",
              vehicleType: "motorcycle",
              vehicleModel: "",
              status: "pending",
              locked: false,
              documents: {
                idCardUrl: "",
                licenseUrl: "",
              },
            });
            await driver.save();
            console.log("✅ Driver created:", driver._id);
          }
        }
      } catch (e: any) {
        console.log(
          "⚠️  Could not find or create driver via user lookup:",
          e.message,
        );
      }
    }

    // Final check
    if (!driver) {
      console.error(
        "❌ Driver not found - ID:",
        req.params.id,
        "Phone:",
        req.body.phone,
      );
      return res.status(404).json({
        success: false,
        error: "Driver not found and could not be created",
      });
    }

    // Update allowed fields
    const allowedFields = [
      "name",
      "vehiclePlate",
      "vehicleType",
      "vehicleModel",
      "documents",
      "online",
    ];

    // Map isOnline to online for compatibility
    console.log("🔍 Request body fields:", {
      isOnline: req.body.isOnline,
      online: req.body.online,
      clientTimestamp: req.body.clientTimestamp,
    });

    if (req.body.isOnline !== undefined) {
      console.log(
        "🔄 Mapping isOnline to online:",
        req.body.isOnline,
        "→",
        req.body.isOnline,
      );
      req.body.online = req.body.isOnline;
      delete req.body.isOnline;
    }

    // RACE CONDITION FIX: If updating online status, check timestamp
    if (req.body.online !== undefined) {
      console.log("⏱️  Checking online status timestamp:", {
        requestValue: req.body.online,
        currentValue: driver.online,
        clientTimestamp: req.body.clientTimestamp,
      });

      const clientTimestamp = req.body.clientTimestamp || Date.now();
      const lastToggleTime = (driver as any).lastOnlineToggleAt
        ? new Date((driver as any).lastOnlineToggleAt).getTime()
        : 0;

      console.log("⏱️  Timestamp comparison:", {
        clientTimestamp: clientTimestamp,
        lastToggleTime: lastToggleTime,
        isStale: clientTimestamp < lastToggleTime,
      });

      if (clientTimestamp < lastToggleTime) {
        console.warn(
          `⚠️  IGNORING STALE REQUEST: client=${clientTimestamp}, lastToggle=${lastToggleTime}`,
        );
        return res.json({
          success: true,
          message: "Request too old (race condition detected), skipping",
          data: driver,
        });
      }

      // Update timestamp to prevent race
      (driver as any).lastOnlineToggleAt = new Date(clientTimestamp);
      console.log(
        `📡 Online status update (timestamp: ${clientTimestamp}):`,
        req.body.online,
      );
    }

    let hasChanges = false;
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const oldValue = (driver as any)[field];
        (driver as any)[field] = req.body[field];

        if (field === "online") {
          console.log(`🎯 [CRITICAL] Setting online field:`, {
            before: oldValue,
            after: (driver as any)[field],
            requested: req.body[field],
            equals: oldValue === req.body[field],
          });
        }

        // Log what changed
        if (JSON.stringify(oldValue) !== JSON.stringify(req.body[field])) {
          console.log(`📝 Updated ${field}:`, {
            from: oldValue
              ? `${JSON.stringify(oldValue).substring(0, 50)}...`
              : "empty",
            to: `${JSON.stringify(req.body[field]).substring(0, 50)}...`,
          });
          hasChanges = true;
        }
      }
    });

    // Make sure nested objects are marked as modified and force save
    if (req.body.documents) {
      driver.markModified("documents");
      hasChanges = true; // Force save when documents are provided
      console.log("📝 Marked documents field as modified - forcing save");
    }

    // Always save if online status is sent (even if same value, for consistency)
    if (req.body.online !== undefined) {
      hasChanges = true;
      console.log("📡 Online status update detected - forcing save:", {
        currentValue: driver.online,
        newValue: req.body.online,
      });
    }

    if (hasChanges) {
      console.log("💾 Attempting save with hasChanges=true:");
      console.log("   Before save - driver.online:", driver.online);

      await driver.save();

      console.log("✅ Driver profile saved:", driver._id);
      console.log("   After save - driver.online:", driver.online);

      // Immediately re-fetch from DB to verify
      if (req.body.online !== undefined) {
        const dbDriver = await Driver.findById(driver._id);
        console.log(
          "🔍 VERIFY from DB - driver.online:",
          (dbDriver as any).online,
        );
        console.log(
          `📊 VERIFY: Driver.online after save = ${(driver as any).online} (requested: ${req.body.online})`,
        );
        console.log(
          `📊 DB FETCH: Driver.online from database = ${(dbDriver as any).online}`,
        );

        if ((dbDriver as any).online !== req.body.online) {
          console.error(
            "❌ **CRITICAL**: DB shows different value than assignment!",
          );
          console.error(
            "   This suggests the schema doesn't allow updates to this field",
          );
        }
      }

      // Broadcast online status change via Socket.IO
      if (req.body.online !== undefined) {
        const io = req.app.get("io");
        if (io) {
          io.emit("driver:online-status-changed", {
            driverId: driver._id,
            online: driver.online,
            timestamp: new Date(),
          });
          console.log("📡 Broadcasted online status change:", {
            driverId: driver._id,
            online: driver.online,
          });
        }
      }
    } else {
      console.log("⚠️  No changes detected, hasChanges=false, skipping save");
    }

    const serverUpdateTime = (driver as any).lastOnlineToggleAt
      ? new Date((driver as any).lastOnlineToggleAt).getTime()
      : (driver as any).updatedAt?.getTime() || Date.now();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: driver,
      serverOnline: driver.online,
      serverUpdateTime: serverUpdateTime, // ← App track lần cuối update
    });
  } catch (error: any) {
    console.error("❌ Driver profile update error:", error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get driver's completed orders with income details (for income breakdown)
router.get("/:id/income-details", async (req: Request, res: Response) => {
  try {
    const driverId = req.params.id;
    let driver;

    // Try ID first, then fallback to User → Driver lookup
    try {
      driver = await Driver.findById(driverId);
    } catch (e) {
      console.log("⚠️  Driver ID not found, trying User lookup");
    }

    // If not found by Driver ID, try User ID → Driver phone lookup
    if (!driver) {
      try {
        const user = await User.findById(driverId);
        console.log("🔍 Found user:", user?.name);
        if (user && (user as any).phone) {
          console.log("📞 Looking up driver by phone:", (user as any).phone);
          driver = await Driver.findOne({ phone: (user as any).phone });
          if (driver) console.log("✅ Found driver by phone:", driver._id);
        }
      } catch (e: any) {
        console.log("❌ User lookup failed:", e.message);
      }
    }

    if (!driver) {
      console.error("❌ Driver not found for ID:", driverId);
      return res
        .status(404)
        .json({ success: false, error: "Driver not found" });
    }

    // Get all completed orders with income details
    const orders = await Order.find({
      driver: driver._id,
      status: "completed",
    }).lean();

    const completedOrders = orders
      .sort((a: any, b: any) => {
        const aTime = new Date(a.updatedAt).getTime();
        const bTime = new Date(b.updatedAt).getTime();
        return bTime - aTime; // Newest first
      })
      .map((order: any) => {
        // Find "completed" event timestamp if exists
        const completedEvent = (order.events || []).find(
          (e: any) => e.type === "completed",
        );
        const completedAt = completedEvent?.timestamp || order.updatedAt;

        return {
          _id: order._id,
          code: order.orderCode,
          income: order.pricingBreakdown?.total || 0,
          completedAt: completedAt,
        };
      });

    // Calculate summary
    const totalIncome = completedOrders.reduce(
      (sum: number, order: any) => sum + (order.income || 0),
      0,
    );
    const count = completedOrders.length;
    const averageIncome = count > 0 ? Math.round(totalIncome / count) : 0;

    res.json({
      success: true,
      data: {
        completedOrders: completedOrders.map((order: any) => ({
          _id: order._id,
          code: order.code,
          income: order.pricingBreakdown?.total || 0,
          completedAt: order.completedAt,
        })),
        summary: {
          totalIncome,
          completedOrdersCount: count,
          averageIncome,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching income details:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pending COD collection for driver
router.get("/:id/cod-pending", async (req: Request, res: Response) => {
  try {
    const driverId = req.params.id;
    let driver;

    // Find driver by ID or via User phone lookup
    try {
      driver = await Driver.findById(driverId);
    } catch {
      const user = await User.findById(driverId);
      if (user && (user as any).phone) {
        driver = await Driver.findOne({ phone: (user as any).phone });
      }
    }

    if (!driver) {
      return res
        .status(404)
        .json({ success: false, error: "Driver not found" });
    }

    // Get all completed orders with COD amount
    const ordersWithCOD = await Order.find({
      driver: driver._id,
      status: "completed",
      codAmount: { $gt: 0 },
    })
      .select("orderCode codAmount updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    // Calculate totals
    const totalCOD = ordersWithCOD.reduce(
      (sum: number, order: any) => sum + (order.codAmount || 0),
      0,
    );
    const count = ordersWithCOD.length;

    res.json({
      success: true,
      data: {
        pendingOrders: ordersWithCOD.map((order: any) => ({
          code: order.orderCode,
          codAmount: order.codAmount,
          completedAt: order.updatedAt,
        })),
        summary: {
          totalPendingCOD: totalCOD,
          pendingOrdersCount: count,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching pending COD:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get COD settlement history for driver
router.get("/:id/cod-settlements", async (req: Request, res: Response) => {
  try {
    const driverId = req.params.id;
    let driver;

    // Find driver by ID or via User phone lookup
    try {
      driver = await Driver.findById(driverId);
    } catch {
      const user = await User.findById(driverId);
      if (user && (user as any).phone) {
        driver = await Driver.findOne({ phone: (user as any).phone });
      }
    }

    if (!driver) {
      return res
        .status(404)
        .json({ success: false, error: "Driver not found" });
    }

    const { CODSettlement } = require("../models");

    // Get settlement history
    const settlements = await CODSettlement.find({
      driver: driver._id,
    })
      .select("amount method note createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats
    const totalSettled = settlements.reduce(
      (sum: number, s: any) => sum + s.amount,
      0,
    );

    res.json({
      success: true,
      data: {
        settlements: settlements.map((s: any) => ({
          amount: s.amount,
          method: s.method,
          note: s.note,
          createdAt: s.createdAt,
        })),
        statistics: {
          totalSettledAmount: totalSettled,
          settlementCount: settlements.length,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching COD settlements:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
