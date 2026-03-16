import { Order, PricingConfig } from "../models";
import { AppError } from "../middleware/errorHandler";
import mongoose from "mongoose";

// Helper function to normalize base64 image with proper data URI prefix
function normalizeBase64Image(imageData: string): string {
  if (!imageData) return imageData;

  // Already has data URI prefix
  if (imageData.startsWith("data:image/")) {
    return imageData;
  }

  // Detect image type from magic bytes
  // JPEG: /9j/
  // PNG: iVBORw0KGgo
  if (imageData.startsWith("/9j/")) {
    return `data:image/jpeg;base64,${imageData}`;
  }
  if (imageData.startsWith("iVBORw0KGgo")) {
    return `data:image/png;base64,${imageData}`;
  }

  // For other formats or if we can't detect, assume JPEG (common from mobile)
  return `data:image/jpeg;base64,${imageData}`;
}

export class OrderService {
  async list(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    from?: string;
    to?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { orderCode: { $regex: query.search, $options: "i" } },
        { "customer.name": { $regex: query.search, $options: "i" } },
        { "customer.phone": { $regex: query.search, $options: "i" } },
      ];
    }
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("driver", "name phone vehiclePlate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const order = await Order.findById(id)
      .populate("driver", "name phone vehiclePlate online")
      .lean();
    if (!order) throw new AppError("Order not found", 404);
    return order;
  }

  async getByOrderCode(orderCode: string) {
    const order = await Order.findOne({ orderCode })
      .populate("driver", "name phone vehiclePlate online")
      .lean();
    if (!order) throw new AppError("Order not found", 404);
    return order;
  }

  async getByCustomerPhone(phone: string) {
    const orders = await Order.find({ "customer.phone": phone })
      .populate("driver", "name phone vehiclePlate online")
      .sort({ createdAt: -1 })
      .lean();
    console.log(
      `📦 Found ${orders.length} orders for phone ${phone}:`,
      orders.map((o) => o.orderCode),
    );
    return orders;
  }

  async update(id: string, updates: any, userId: string) {
    const order = await Order.findById(id);
    if (!order) throw new AppError("Order not found", 404);

    // Handle driver ID aliases - normalize different field names for driver ID
    if (updates.assignedTo && !updates.driver) {
      updates.driver = updates.assignedTo;
    }
    if (updates.driverId && !updates.driver) {
      updates.driver = updates.driverId;
    }

    const auditEntries: any[] = [];

    // Track all changes for audit logging
    for (const [key, value] of Object.entries(updates)) {
      if (
        key === "status" ||
        key === "codAmount" ||
        key === "driver" ||
        key === "driverName" ||
        key === "driverPhone"
      ) {
        auditEntries.push({
          action: `updated_${key}`,
          field: key,
          oldValue: (order as any)[key],
          newValue: value,
          performedBy: new mongoose.Types.ObjectId(userId),
          performedAt: new Date(),
        });
      }
    }

    // Handle driver field specially - convert string to ObjectId and fetch driver details
    if (updates.driver) {
      if (typeof updates.driver === "string") {
        updates.driver = new mongoose.Types.ObjectId(updates.driver);
      }

      // Fetch driver details to store in order
      const { Driver, User } = await import("../models");
      try {
        // First try to find by driver ID
        let driver = await Driver.findById(updates.driver).lean();
        
        // If not found, maybe it's a User ID - lookup driver by phone
        if (!driver) {
          console.log("⚠️ Driver ID not found, trying to lookup by User ID...");
          const user = await User.findById(updates.driver).lean();
          if (user && (user as any).phone) {
            console.log("📞 Found user, looking up driver by phone:", (user as any).phone);
            driver = await Driver.findOne({ phone: (user as any).phone }).lean();
            if (driver) {
              console.log("✅ Found driver by phone, updating driver ID");
              updates.driver = new mongoose.Types.ObjectId(driver._id);
            }
          }
        }
        
        if (driver) {
          updates.driverName = driver.name;
          updates.driverPhone = driver.phone;
        }
      } catch (err) {
        console.log("⚠️  Could not fetch driver details:", err);
      }

      // Add driver assignment event to timeline
      order.events.push({
        type: "driver_assigned",
        timestamp: new Date(),
        note: `Driver ${updates.driverName} assigned`,
      });
    }

    // Handle status change - create timeline event
    if (updates.status && updates.status !== order.status) {
      const statusEventMap: Record<string, string> = {
        pending: "order_created",
        assigned: "driver_assigned",
        picking_up: "driver_picking_up",
        delivering: "picked_up",
        completed: "delivered",
        cancelled: "cancelled",
      };

      const eventType =
        statusEventMap[updates.status] || `status_${updates.status}`;
      order.events.push({
        type: eventType,
        timestamp: new Date(),
        note: `Status changed to ${updates.status}`,
      });
    }

    // Handle delivery/pickup photos from mobile app
    if (updates.deliveryPhoto) {
      if (!order.deliveryProofImages) {
        order.deliveryProofImages = [];
      }
      // Normalize base64 image with proper data URI prefix
      const normalizedPhoto = normalizeBase64Image(updates.deliveryPhoto);
      order.deliveryProofImages.push(normalizedPhoto);

      // Parse timestamp - handle both ISO string and numeric timestamps
      let photoTime = new Date();
      if (updates.deliveryTime) {
        const parsedTime = parseInt(updates.deliveryTime);
        if (!isNaN(parsedTime)) {
          photoTime = new Date(parsedTime);
        } else {
          photoTime = new Date(updates.deliveryTime);
        }
      }

      order.events.push({
        type: "delivery_proof_uploaded",
        timestamp: photoTime,
        note: "Delivery photo uploaded",
      });
      delete updates.deliveryPhoto; // Remove from updates to avoid double storage
      delete updates.deliveryTime;
    }

    if (updates.pickupPhoto) {
      if (!order.deliveryProofImages) {
        order.deliveryProofImages = [];
      }
      // Normalize base64 image with proper data URI prefix
      const normalizedPhoto = normalizeBase64Image(updates.pickupPhoto);
      order.deliveryProofImages.push(normalizedPhoto);

      order.events.push({
        type: "pickup_proof_uploaded",
        timestamp: new Date(),
        note: "Pickup photo uploaded",
      });
      delete updates.pickupPhoto; // Remove from updates to avoid double storage
    }

    Object.assign(order, updates);
    if (auditEntries.length > 0) {
      order.auditLogs.push(...auditEntries);
    }

    await order.save();

    // Re-query from database with populated driver info
    const updatedOrder = await Order.findById(id)
      .populate("driver", "name phone vehiclePlate online")
      .lean();
    return updatedOrder;
  }

  async updateComplaint(
    id: string,
    complaint: { status: string; note?: string },
    userId: string,
  ) {
    const order = await Order.findById(id);
    if (!order) throw new AppError("Order not found", 404);

    const oldStatus = order.complaint?.status || "none";

    if (!order.complaint) {
      order.complaint = {
        status: complaint.status as any,
        notes: [],
        updatedAt: new Date(),
      };
    } else {
      order.complaint.status = complaint.status as any;
      order.complaint.updatedAt = new Date();
    }

    if (complaint.note) {
      order.complaint.notes.push(complaint.note);
    }

    order.auditLogs.push({
      action: "updated_complaint",
      field: "complaint.status",
      oldValue: oldStatus,
      newValue: complaint.status,
      performedBy: new mongoose.Types.ObjectId(userId),
      performedAt: new Date(),
    });

    await order.save();

    // Re-query from database with populated driver info
    const updatedOrder = await Order.findById(id)
      .populate("driver", "name phone vehiclePlate online")
      .lean();
    return updatedOrder;
  }

  async getAuditLogs(id: string) {
    const order = await Order.findById(id)
      .select("auditLogs orderCode")
      .populate("auditLogs.performedBy", "name email")
      .lean();
    if (!order) throw new AppError("Order not found", 404);
    return order.auditLogs;
  }

  // Helper: Check if current time is peak hour (7-9 or 17-19)
  private isPeakHour(): boolean {
    const hour = new Date().getHours();
    return (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19);
  }

  // Helper: Calculate base price based on region
  private getBasePrice(address: string): number {
    const addr = address.toLowerCase();
    const seRegions = [
      "hồ chí minh",
      "tphcm",
      "cần thơ",
      "cà mau",
      "bình dương",
      "đồng nai",
      "long an",
      "tiền giang",
      "an giang",
      "kiên giang",
      "vĩnh long",
      "trà vinh",
      "sóc trăng",
      "bạc liêu",
      "hậu giang",
      "vũng tàu",
      "tây ninh",
      "bến tre",
    ];

    return seRegions.some((region) => addr.includes(region)) ? 50000 : 100000;
  }

  // Helper: Calculate size surcharge
  private calculateSizeSurcharge(size: string): number {
    const sizeStr = (size || "").toLowerCase();
    if (sizeStr.includes("vừa")) return 25000;
    if (sizeStr.includes("lớn")) return 50000;
    return 0; // small
  }

  async create(data: {
    customer: {
      name: string;
      phone: string;
      address: string;
    };
    recipient?: {
      name: string;
      phone: string;
    };
    pickupAddress: string;
    deliveryAddress: string;
    distanceKm: number;
    serviceType: "express" | "economy";
    isBulky?: boolean;
    codAmount?: number;
    size?: string; // new: size field for surcharge calculation
  }) {
    try {
      // Generate unique order code
      const orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Load active pricing config
      let pricingConfig = await PricingConfig.findOne({ active: true });

      // ===== PRICING CALCULATION (matches Android app logic) =====

      // 1. Base price (from config or region-based)
      let baseFare =
        pricingConfig?.baseFare || this.getBasePrice(data.deliveryAddress);

      // 2. Size surcharge (0, 25k, or 50k based on size field)
      const sizeSurcharge = this.calculateSizeSurcharge(data.size || "");

      // 3. Service fee (0 for economy, or basePrice * (multiplier - 1) for express)
      let serviceFee = 0;
      if (data.serviceType === "express") {
        const multiplier = pricingConfig?.services?.express?.multiplier || 1.3;
        serviceFee = Math.round(baseFare * (multiplier - 1));
      }

      // 4. Peak hour surcharge (percentage of baseFare + sizeSurcharge + serviceFee)
      let peakHourSurcharge = 0;
      if (this.isPeakHour()) {
        const surchargePercent = pricingConfig?.peakHourSurchargePercent || 20;
        const subtotal = baseFare + sizeSurcharge + serviceFee;
        peakHourSurcharge = Math.round((surchargePercent / 100) * subtotal);
      }

      // 5. COD fee (fixed amount from config or percentage of COD amount)
      let codFee = 0;
      if (data.codAmount && data.codAmount > 0) {
        if (pricingConfig?.codFee) {
          if (typeof pricingConfig.codFee === "number") {
            // Simple fixed amount
            codFee = pricingConfig.codFee;
          } else if (typeof pricingConfig.codFee === "object") {
            // Complex object with type and value
            const codFeeConfig = pricingConfig.codFee as any;
            if (codFeeConfig.type === "percentage") {
              codFee = Math.round((data.codAmount * codFeeConfig.value) / 100);
            } else {
              codFee = codFeeConfig.value || 0;
            }
          }
        }
      }

      // Total
      const total =
        baseFare + sizeSurcharge + serviceFee + peakHourSurcharge + codFee;

      const pricingBreakdown = {
        baseFare,
        distanceCharge: sizeSurcharge, // renamed from distanceCharge to sizeSurcharge for clarity
        peakHourSurcharge,
        bulkyItemSurcharge: serviceFee, // renamed from bulkyItemSurcharge to serviceFee
        codFee,
        total,
      };

      const order = new Order({
        orderCode,
        customer: data.customer,
        recipient: data.recipient || { name: "", phone: "" },
        status: "pending",
        serviceType: data.serviceType,
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
        distanceKm: data.distanceKm,
        isBulky: data.isBulky || false,
        pricingBreakdown,
        codAmount: data.codAmount || 0,
        events: [
          {
            type: "order_created",
            timestamp: new Date(),
            note: "Order created",
          },
        ],
        auditLogs: [],
      });

      await order.save();
      return {
        success: true,
        message: "Order created successfully",
        data: order,
      };
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }

  // Add failure reason to order timeline
  async addFailureReason(id: string, reason: string, userId: string) {
    const order = await Order.findById(id);
    if (!order) throw new AppError("Order not found", 404);

    // Add failure event to timeline
    order.events.push({
      type: "delivery_failed",
      timestamp: new Date(),
      note: reason,
    });

    // Add audit log
    order.auditLogs.push({
      action: "added_failure_reason",
      field: "events",
      newValue: reason,
      performedBy: new mongoose.Types.ObjectId(userId),
      performedAt: new Date(),
    });

    await order.save();

    // Re-query from database with populated driver info
    const updatedOrder = await Order.findById(id)
      .populate("driver", "name phone vehiclePlate online")
      .lean();
    return updatedOrder;
  }

  // Get timeline/events for an order
  async getTimeline(id: string) {
    const order = await Order.findById(id).select("orderCode events").lean();
    if (!order) throw new AppError("Order not found", 404);
    return {
      orderCode: order.orderCode,
      timeline: order.events.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    };
  }

  // Add delivery proof images to order
  async addDeliveryProofImages(id: string, images: string[], userId: string) {
    const order = await Order.findById(id);
    if (!order) throw new AppError("Order not found", 404);

    // Add images to delivery proof
    if (!order.deliveryProofImages) {
      order.deliveryProofImages = [];
    }
    // Normalize each image with proper data URI prefix before storing
    const normalizedImages = images.map((img) => normalizeBase64Image(img));
    order.deliveryProofImages.push(...normalizedImages);

    // Add event to timeline
    order.events.push({
      type: "delivery_proof_uploaded",
      timestamp: new Date(),
      note: `${images.length} proof image(s) uploaded`,
    });

    // Add audit log with valid ObjectId
    let performedByUserId: any;
    try {
      performedByUserId = new mongoose.Types.ObjectId(userId);
    } catch (e) {
      // Default to system user if not a valid ObjectId
      performedByUserId = new mongoose.Types.ObjectId(
        "000000000000000000000001",
      );
    }

    order.auditLogs.push({
      action: "added_delivery_proof_images",
      field: "deliveryProofImages",
      newValue: `${images.length} images added`,
      performedBy: performedByUserId,
      performedAt: new Date(),
    });

    await order.save();

    // Re-query from database with populated driver info
    const updatedOrder = await Order.findById(id)
      .populate("driver", "name phone vehiclePlate online")
      .lean();
    return updatedOrder;
  }

  // Get delivery proof images
  async getDeliveryProofImages(id: string) {
    const order = await Order.findById(id)
      .select("orderCode deliveryProofImages")
      .lean();
    if (!order) throw new AppError("Order not found", 404);
    return {
      orderCode: order.orderCode,
      proofImages: order.deliveryProofImages || [],
      totalImages: (order.deliveryProofImages || []).length,
    };
  }
}

export const orderService = new OrderService();
