import { Driver, CODSettlement, Order } from "../models";
import { AppError } from "../middleware/errorHandler";
import mongoose from "mongoose";

export class DriverService {
  async list(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    locked?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.locked !== undefined) filter.locked = query.locked === "true";
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { phone: { $regex: query.search, $options: "i" } },
        { vehiclePlate: { $regex: query.search, $options: "i" } },
      ];
    }

    // Use aggregation to join with orders and calculate income efficiently
    const drivers = await Driver.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "orders",
          let: { driverId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$driver", "$$driverId"] },
                status: "completed",
              },
            },
            {
              $group: {
                _id: null,
                totalIncome: { $sum: "$pricingBreakdown.total" },
                completedOrders: { $sum: 1 },
              },
            },
          ],
          as: "income",
        },
      },
      {
        $addFields: {
          totalIncome: {
            $ifNull: [{ $arrayElemAt: ["$income.totalIncome", 0] }, 0],
          },
          completedOrders: {
            $ifNull: [{ $arrayElemAt: ["$income.completedOrders", 0] }, 0],
          },
        },
      },
      { $project: { income: 0 } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          drivers: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const [data] = drivers;
    const total = data.total[0]?.count || 0;

    return {
      drivers: data.drivers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async calculateDriverIncome(driverId: string) {
    try {
      const driverObjectId = new mongoose.Types.ObjectId(driverId);

      // Kiểm tra có orders nào gán cho driver này không
      const totalOrders = await Order.countDocuments({
        driver: driverObjectId,
      });
      const completedOrders = await Order.countDocuments({
        driver: driverObjectId,
        status: "completed",
      });

      // Tính tổng thu nhập từ completed orders
      const result = await Order.aggregate([
        {
          $match: {
            driver: driverObjectId,
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: "$pricingBreakdown.total" },
          },
        },
      ]);

      return {
        totalIncome: result[0]?.totalIncome || 0,
        completedOrders: completedOrders,
      };
    } catch (error) {
      console.error(`Error calculating income for driver ${driverId}:`, error);
      return { totalIncome: 0, completedOrders: 0 };
    }
  }

  async getById(id: string) {
    console.log("🔍 getById called with ID:", id);
    const driver = await Driver.findById(id).lean();
    console.log(
      "🔍 Driver.findById result:",
      driver?._id?.toString() || "NOT FOUND",
    );

    if (!driver) throw new AppError("Driver not found", 404);

    // Calculate driver income from completed orders
    const income = await this.calculateDriverIncome(id);
    console.log("🔍 Income calculated:", income);

    return {
      ...driver,
      totalIncome: income.totalIncome,
      completedOrders: income.completedOrders,
    };
  }

  async getOnline() {
    return Driver.find({ online: true, status: "approved" })
      .select("name phone lastLocation vehiclePlate")
      .lean();
  }

  async approve(id: string, action: "approved" | "rejected") {
    const driver = await Driver.findById(id);
    if (!driver) throw new AppError("Driver not found", 404);
    driver.status = action;
    await driver.save();
    return driver;
  }

  async toggleLock(id: string) {
    const driver = await Driver.findById(id);
    if (!driver) throw new AppError("Driver not found", 404);
    driver.locked = !driver.locked;
    if (driver.locked) driver.online = false;
    await driver.save();
    return driver;
  }

  async getCodSummary() {
    const drivers = await Driver.find({ codHolding: { $gt: 0 } })
      .select("name phone codHolding vehiclePlate")
      .sort({ codHolding: -1 })
      .lean();
    const totalHolding = drivers.reduce((sum, d) => sum + d.codHolding, 0);
    return { drivers, totalHolding };
  }

  async settle(
    data: { driverId: string; amount: number; method: string; note: string },
    userId: string,
  ) {
    const driver = await Driver.findById(data.driverId);
    if (!driver) throw new AppError("Driver not found", 404);
    if (data.amount > driver.codHolding)
      throw new AppError("Settlement amount exceeds COD holding", 400);

    driver.codHolding -= data.amount;
    await driver.save();

    const settlement = new CODSettlement({
      driver: new mongoose.Types.ObjectId(data.driverId),
      amount: data.amount,
      method: data.method,
      note: data.note,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    await settlement.save();
    return settlement;
  }

  async getSettlements(query: {
    page?: number;
    limit?: number;
    driverId?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.driverId) filter.driver = query.driverId;

    const [settlements, total] = await Promise.all([
      CODSettlement.find(filter)
        .populate("driver", "name phone")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CODSettlement.countDocuments(filter),
    ]);

    return {
      settlements,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async updateProfile(id: string, updates: any) {
    const driver = await Driver.findById(id);
    if (!driver) throw new AppError("Driver not found", 404);

    // Whitelist updatable fields
    const allowedFields = [
      "name",
      "vehiclePlate",
      "vehicleType",
      "vehicleModel",
      "documents",
    ];
    const filteredUpdates: any = {};
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    Object.assign(driver, filteredUpdates);
    await driver.save();
    return driver;
  }

  async exportCsv() {
    const settlements = await CODSettlement.find()
      .populate("driver", "name phone")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    const header = "Date,Driver,Phone,Amount,Method,Note,Created By\n";
    const rows = settlements.map((s: any) => {
      return `${new Date(s.createdAt).toISOString()},${s.driver?.name || ""},${s.driver?.phone || ""},${s.amount},${s.method},${s.note},${s.createdBy?.name || ""}`;
    });

    return header + rows.join("\n");
  }
}

export const driverService = new DriverService();
