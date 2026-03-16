"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const models_1 = require("./models");
async function getDriverIncome() {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI || "mongodb://localhost:27017/shipper");
        console.log("✅ Connected to MongoDB\n");
        const DRIVER_ID = "65b1a9c50409b2241cbbc1d2";
        // Query: Tính thu nhập tài xế huy phan
        const result = await models_1.Order.aggregate([
            {
                $match: {
                    driver: new mongoose_1.default.Types.ObjectId(DRIVER_ID),
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
            console.log("❌ Không tìm thấy đơn hàng nào của tài xế này\n");
            await mongoose_1.default.connection.close();
            return;
        }
        const income = result[0];
        console.log("📊 === THU NHẬP TÀI XẾ HUY PHAN ===\n");
        console.log(`✅ Số đơn hàng hoàn thành: ${income.completedOrders}`);
        console.log(`💰 Tổng thu nhập: ${income.totalIncome.toLocaleString("vi-VN")}đ`);
        console.log(`📈 Thu nhập trung bình/đơn: ${Math.round(income.avgIncome).toLocaleString("vi-VN")}đ`);
        console.log(`📉 Thu nhập nhỏ nhất: ${income.minIncome.toLocaleString("vi-VN")}đ`);
        console.log(`📈 Thu nhập lớn nhất: ${income.maxIncome.toLocaleString("vi-VN")}đ`);
        console.log("\n");
        // Lấy chi tiết từng đơn
        const orders = await models_1.Order.find({
            driver: DRIVER_ID,
            status: "completed",
        })
            .sort({ createdAt: -1 })
            .lean();
        console.log("📋 === CHI TIẾT CÁC ĐƠN HÀNG ===\n");
        orders.forEach((order, idx) => {
            console.log(`${idx + 1}. ${order.orderCode}`);
            console.log(`   Service: ${order.serviceType} | Distance: ${order.distanceKm}km`);
            console.log(`   Thu nhập: ${order.pricingBreakdown.total.toLocaleString("vi-VN")}đ`);
            console.log(`   Ngày: ${new Date(order.createdAt).toLocaleString("vi-VN")}`);
            console.log("");
        });
        await mongoose_1.default.connection.close();
        console.log("✅ Hoàn thành!");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Lỗi:", error.message);
        process.exit(1);
    }
}
getDriverIncome();
