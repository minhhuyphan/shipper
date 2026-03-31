import { Router, Request, Response } from "express";
import { z } from "zod";
import { orderService } from "../services/orderService";
import { Order } from "../models";
import { validate } from "../middleware/validate";
import { AuthRequest, auth } from "../middleware/auth";
import mongoose from "mongoose";

const router = Router();

// ⚠️ IMPORTANT: Remove this route after testing - it's only for development
router.post("/test-data/create", async (req: Request, res: Response) => {
  try {
    const { driverId, count = 15 } = req.body;
    const DRIVER_ID = driverId || "65b1a9c50409b2241cbbc1d2";
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
        driver: new mongoose.Types.ObjectId(DRIVER_ID),
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

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimals
}

// Helper function to normalize base64 images with proper data URI prefix
function normalizeBase64Image(imageData: string): string {
  if (!imageData) return imageData;

  // Already has data URI prefix or is a URL
  if (imageData.startsWith("data:image/") || imageData.startsWith("http")) {
    return imageData;
  }

  // Detect image type from magic bytes
  if (imageData.startsWith("/9j/")) {
    return `data:image/jpeg;base64,${imageData}`;
  }
  if (imageData.startsWith("iVBORw0KGgo")) {
    return `data:image/png;base64,${imageData}`;
  }

  // For other formats or if we can't detect, assume JPEG
  return `data:image/jpeg;base64,${imageData}`;
}

// Helper function to normalize images in order response
function normalizeOrderImages(order: any): any {
  if (
    order &&
    order.deliveryProofImages &&
    Array.isArray(order.deliveryProofImages)
  ) {
    order.deliveryProofImages = order.deliveryProofImages.map((img: string) =>
      normalizeBase64Image(img),
    );
  }

  // Normalize package photo if present
  if (order && order.packagePhoto) {
    order.packagePhoto = normalizeBase64Image(order.packagePhoto);
  }

  return order;
}

// Create new order - supports multiple format variants
const createOrderSchema = z
  .object({
    // Support nested customer object, customer ID string, or flat fields
    customer: z
      .union([
        z.object({
          name: z.string().min(1),
          phone: z.string().min(10),
          address: z.string().min(1),
        }),
        z.string().min(1), // Accept customer ID as string
      ])
      .optional(),
    // Support flat customer fields (for mobile/legacy apps)
    customerName: z.string().min(1).optional(),
    customerPhone: z.string().min(10).optional(),

    pickupAddress: z.string().min(1),
    deliveryAddress: z.string().min(1),

    // Support explicit distanceKm
    distanceKm: z.number().min(0).optional(),

    // Support coordinate-based distance calculation
    pickup: z
      .object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional(),
      })
      .optional(),
    dropoff: z
      .object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional(),
      })
      .optional(),

    serviceType: z.enum(["express", "economy"]),
    isBulky: z.boolean().optional(),
    codAmount: z.number().optional(),

    // Recipient info (new feature)
    recipient: z
      .object({
        name: z.string().optional(),
        phone: z.string().optional(),
      })
      .optional(),

    // Allow additional fields (ignored)
    itemType: z.string().optional(),
    price: z.number().optional(),
    size: z.string().optional(),
    weight: z.string().optional(),
  })
  .passthrough(); // Allow extra fields that aren't defined

router.post(
  "/",
  validate(createOrderSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body;

      // Transform request to standard format
      let transformedData: any = {
        pickupAddress: body.pickupAddress,
        deliveryAddress: body.deliveryAddress,
        serviceType: body.serviceType,
        codAmount: body.codAmount || 0,
        isBulky: body.isBulky || false,
        size: body.size || "Nhỏ",
        packagePhoto: body.packagePhoto,
      };

      // Handle customer info - support object, string ID, or flat fields
      if (body.customer) {
        if (typeof body.customer === "string") {
          // Customer is an ID string, try to fetch from database
          try {
            const { User } = await import("../models/User");
            const user = await User.findById(body.customer);
            if (user) {
              transformedData.customer = {
                name: user.name,
                phone: user.phone || "",
                address: body.deliveryAddress,
              };
            } else {
              // User not found, use default
              transformedData.customer = {
                name: "Unknown",
                phone: "",
                address: body.deliveryAddress,
              };
            }
          } catch (err) {
            // If lookup fails, use default
            transformedData.customer = {
              name: "Unknown",
              phone: "",
              address: body.deliveryAddress,
            };
          }
        } else if (typeof body.customer === "object") {
          // Customer is already an object
          transformedData.customer = body.customer;
        }
      } else {
        // Use flat fields
        transformedData.customer = {
          name: body.customerName || "Unknown",
          phone: body.customerPhone || "",
          address: body.deliveryAddress,
        };
      }

      // Calculate distance if not provided but coordinates are available
      let distanceKm = body.distanceKm;
      if (
        !distanceKm &&
        body.pickup?.lat &&
        body.pickup?.lng &&
        body.dropoff?.lat &&
        body.dropoff?.lng
      ) {
        distanceKm = calculateDistance(
          body.pickup.lat,
          body.pickup.lng,
          body.dropoff.lat,
          body.dropoff.lng,
        );
        console.log(
          `📍 Calculated distance from coordinates: ${distanceKm} km`,
        );
      }

      if (distanceKm === undefined || distanceKm === null) {
        throw new Error(
          "distanceKm is required or must provide pickup/dropoff coordinates",
        );
      }

      transformedData.distanceKm = distanceKm;

      // Add recipient data if provided
      if (body.recipient && typeof body.recipient === "object") {
        transformedData.recipient = {
          name: body.recipient.name || "",
          phone: body.recipient.phone || "",
        };
        console.log("👤 Recipient data added:", transformedData.recipient);
      }

      console.log("📝 Creating new order with data:", {
        customer: transformedData.customer,
        pickupAddress: transformedData.pickupAddress,
        deliveryAddress: transformedData.deliveryAddress,
        distanceKm: transformedData.distanceKm,
        serviceType: transformedData.serviceType,
        size: transformedData.size,
        codAmount: transformedData.codAmount,
      });

      const result = await orderService.create(transformedData);
      console.log("✅ Order created successfully:", result.data._id);
      res.status(201).json(result);
    } catch (error: any) {
      console.error("❌ Order creation error:", error.message);
      console.error("Stack:", error.stack);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await orderService.list({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
      search: req.query.search as string,
      from: req.query.from as string,
      to: req.query.to as string,
    });

    // Normalize images in all orders
    if (result.orders && Array.isArray(result.orders)) {
      result.orders = result.orders.map((order: any) =>
        normalizeOrderImages(order),
      );
    }

    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get customer's orders by phone (for mobile app)
router.get("/customer/:phone", async (req: Request, res: Response) => {
  try {
    console.log("📱 Fetching orders for customer:", req.params.phone);
    const orders = await orderService.getByCustomerPhone(req.params.phone);
    // Normalize images in all orders
    const normalizedOrders = orders.map((order: any) =>
      normalizeOrderImages(order),
    );
    res.json({
      success: true,
      data: normalizedOrders,
    });
  } catch (error: any) {
    console.error("❌ Error fetching customer orders:", error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// Track order by order code (for mobile app) - public endpoint
router.get("/track/:orderCode", async (req: Request, res: Response) => {
  try {
    console.log("📦 Tracking order:", req.params.orderCode);
    const order = await orderService.getByOrderCode(req.params.orderCode);
    // Normalize images before sending response
    const normalizedOrder = normalizeOrderImages(order);
    res.json({
      success: true,
      data: normalizedOrder,
    });
  } catch (error: any) {
    console.error("❌ Error tracking order:", error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get order by order code (admin endpoint) - wrapped for admin
router.get("/code/:orderCode", async (req: Request, res: Response) => {
  try {
    const order = await orderService.getByOrderCode(req.params.orderCode);
    // Normalize images before sending response
    const normalizedOrder = normalizeOrderImages(order);
    res.json(normalizedOrder);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const order = await orderService.getById(req.params.id);
    // Normalize images before sending response
    const normalizedOrder = normalizeOrderImages(order);
    res.json(normalizedOrder);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

const updateOrderSchema = z
  .object({
    status: z
      .enum([
        "pending",
        "assigned",
        "picking_up",
        "delivering",
        "completed",
        "cancelled",
      ])
      .optional(),
    codAmount: z.number().optional(),
    driver: z.string().optional(), // MongoDB ObjectId for driver
    assignedTo: z.string().optional(), // Alias for driver
    driverId: z.string().optional(), // Alias for driver
    driverName: z.string().optional(),
    driverPhone: z.string().optional(),
    deliveryProofImages: z.array(z.string()).optional(), // Support delivery proof images
    deliveryPhoto: z.string().optional(), // Photo from delivery (base64 or URL)
    pickupPhoto: z.string().optional(), // Photo from pickup (base64 or URL)
    deliveryTime: z.string().optional(), // Timestamp when delivery photo was taken
    notes: z.string().optional(), // Delivery notes
  })
  .passthrough();

router.patch(
  "/:id",
  auth,
  validate(updateOrderSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const order = await orderService.update(
        req.params.id,
        req.body,
        req.user._id.toString(),
      );
      // Normalize images before sending response
      const normalizedOrder = normalizeOrderImages(order);
      res.json({
        success: true,
        data: normalizedOrder,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },
);

const complaintSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "rejected"]),
  note: z.string().optional(),
});

router.patch(
  "/:id/complaint",
  validate(complaintSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const order = await orderService.updateComplaint(
        req.params.id,
        req.body,
        req.user._id.toString(),
      );
      res.json(order);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },
);

router.get("/:id/audit", async (req: Request, res: Response) => {
  try {
    const logs = await orderService.getAuditLogs(req.params.id);
    res.json(logs);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Add failure reason to order timeline
const failureReasonSchema = z.object({
  reason: z.string().min(1).describe("Failure reason/failure description"),
});

router.post(
  "/:id/failure-reason",
  auth,
  validate(failureReasonSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const order = await orderService.addFailureReason(
        req.params.id,
        req.body.reason,
        req.user._id.toString(),
      );
      res.json({
        success: true,
        message: "Failure reason added to timeline",
        data: order,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },
);

// Get order timeline/events
router.get("/:id/timeline", async (req: Request, res: Response) => {
  try {
    const timeline = await orderService.getTimeline(req.params.id);
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Add delivery proof images (public endpoint for driver/customer to upload)
const deliveryProofSchema = z.object({
  images: z
    .array(z.string())
    .min(1)
    .describe("Array of image URLs or base64 strings"),
});

router.post(
  "/:id/delivery-proof",
  validate(deliveryProofSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      // For public uploads without authentication, use a default system user ID
      const userId = req.user?._id?.toString() || "system";

      const order = await orderService.addDeliveryProofImages(
        req.params.id,
        req.body.images,
        userId,
      );
      res.json({
        success: true,
        message: `${req.body.images.length} delivery proof image(s) added`,
        data: order,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },
);

// Get delivery proof images
router.get("/:id/delivery-proof", async (req: Request, res: Response) => {
  try {
    const proofImages = await orderService.getDeliveryProofImages(
      req.params.id,
    );
    res.json({
      success: true,
      data: proofImages,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Create test orders for driver income testing
router.post("/test-data/create", async (req: Request, res: Response) => {
  try {
    const { driverId, count = 15 } = req.body;
    const DRIVER_ID = driverId || "65b1a9c50409b2241cbbc1d2";

    const Order = require("../models").Order;
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
        driver: DRIVER_ID,
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
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
