import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import swaggerUi from "swagger-ui-express";
import { config } from "./config";
import { connectDB } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { auth } from "./middleware/auth";
import { swaggerSpec } from "./swagger";

// Routes
import authRoutes from "./routes/auth";
import statsRoutes from "./routes/stats";
import orderRoutes from "./routes/orders";
import pricingRoutes from "./routes/pricing";
import driverRoutes from "./routes/drivers";
import driverMobileRoutes from "./routes/driver-mobile";
import userRoutes from "./routes/users";

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new SocketIOServer(server, {
  cors: { origin: config.clientUrl, methods: ["GET", "POST"] },
});

// Middleware
app.use(
  cors({
    origin: "*", // Allow all origins for ngrok/mobile
    credentials: false,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public routes
app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverMobileRoutes);
app.use("/api/orders", orderRoutes);

// Test data endpoint (remove after testing)
app.post("/api/test/create-orders", async (req, res) => {
  try {
    const { Order, Driver } = await import("./models");
    const mongoose = await import("mongoose");
    const { driverId, count = 15 } = req.body;
    const DRIVER_ID = driverId || "65b1a9c50409b2241cbbc1d2";

    // Ensure driver exists
    const driverObjectId = new mongoose.default.Types.ObjectId(DRIVER_ID);
    let driver = await Driver.findById(DRIVER_ID);
    if (!driver) {
      console.log("🆕 Creating test driver:", DRIVER_ID);
      driver = new Driver({
        _id: driverObjectId,
        name: "huy phan",
        phone: "0987654321",
        vehiclePlate: "A12345",
        vehicleType: "motorcycle",
        vehicleModel: "Wave",
        status: "approved",
        locked: false,
        documents: { idCardUrl: "", licenseUrl: "" },
        online: true,
      });
      await driver.save();
    }

    const orders = [];
    const basePrice = 17000;

    for (let i = 1; i <= count; i++) {
      orders.push({
        orderCode: `ORD-TEST-${Date.now()}-${i}`,
        customer: {
          name: `Test Customer ${i}`,
          phone: `099${String(i).padStart(7, "0")}`,
          address: `Test Address ${i}`,
        },
        driver: driverObjectId,
        driverName: "Test Driver",
        driverPhone: "0123456789",
        status: "completed",
        serviceType: i % 2 === 0 ? "express" : "economy",
        pickupAddress: `Pickup ${i}`,
        deliveryAddress: `Delivery ${i}`,
        distanceKm: 5 + i,
        isBulky: false,
        pricingBreakdown: {
          baseFare: 10000,
          distanceCharge: 5000 + i * 500,
          peakHourSurcharge: i % 3 === 0 ? 2000 : 0,
          bulkyItemSurcharge: 0,
          codFee: 2000,
          total: basePrice + i * 500,
        },
        codAmount: 100000 + i * 10000,
        deliveryProofImages: [],
        events: [
          {
            type: "delivered",
            timestamp: new Date(),
            note: "Test completed",
          },
        ],
        auditLogs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const result = await Order.insertMany(orders);
    const total = orders.reduce((sum, o) => sum + o.pricingBreakdown.total, 0);

    res.json({
      success: true,
      message: `Created ${result.length} test orders`,
      count: result.length,
      totalIncome: total,
      averageIncome: Math.round(total / result.length),
    });
  } catch (error: any) {
    console.error("Error creating test orders:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete test orders
app.delete("/api/test/orders", async (req, res) => {
  try {
    const { Order } = await import("./models");
    const result = await Order.deleteMany({
      orderCode: { $regex: "^ORD-TEST-" },
    });
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} test orders`,
    });
  } catch (error: any) {
    console.error("Error deleting test orders:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get driver income (debug endpoint)
app.get("/api/test/driver-income", async (req, res) => {
  try {
    const { Order } = await import("./models");
    const mongoose = await import("mongoose");
    const driverId = req.query.driverId as string;

    if (!driverId) {
      return res.status(400).json({ error: "driverId required" });
    }

    const result = await Order.aggregate([
      {
        $match: {
          driver: new mongoose.default.Types.ObjectId(driverId),
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$pricingBreakdown.total" },
          completedOrders: { $sum: 1 },
          avgIncome: { $avg: "$pricingBreakdown.total" },
          minIncome: { $min: "$pricingBreakdown.total" },
          maxIncome: { $max: "$pricingBreakdown.total" },
        },
      },
    ]);

    if (result.length === 0) {
      return res.json({
        success: true,
        totalIncome: 0,
        completedOrders: 0,
        message: "No completed orders found",
      });
    }

    res.json({
      success: true,
      ...result[0],
      _id: undefined,
    });
  } catch (error: any) {
    console.error("Error getting driver income:", error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to debug driver profile
app.get("/api/test/driver-profile/:id", async (req, res) => {
  try {
    const { driverService } = await import("./services/driverService");
    const driver = await driverService.getById(req.params.id);
    res.json({
      success: true,
      data: driver,
      totalIncome: driver.totalIncome,
      completedOrders: driver.completedOrders,
    });
  } catch (error: any) {
    console.error("Error getting driver profile:", error);
    res.status(500).json({ error: error.message });
  }
});

// Protected routes
app.use("/api/admin/stats", auth, statsRoutes);
app.use("/api/admin/orders", auth, orderRoutes);
app.use("/api/admin/pricing", auth, pricingRoutes);
app.use("/api/admin/drivers", auth, driverRoutes);
app.use("/api/users", userRoutes);

// Error handler
app.use(errorHandler);

// Socket.IO events
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// Make io available to routes
app.set("io", io);

// Start
const start = async () => {
  await connectDB();
  server.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
    console.log(`📚 Swagger docs at http://localhost:${config.port}/api-docs`);
  });
};

start().catch(console.error);

export { app, io };
