/**
 * Settlement Cleanup Tool
 * Chức năng: Đánh dấu hàng loạt đơn hàng là đã đối soát (codSettled: true) khi số dư thực tế đã về 0.
 * Thành phần: Cập nhật trường codSettled cho các đơn hàng hoàn thành của một tài xế cụ thể.
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { Order } from "./models";

const MONGODB_URI = "mongodb+srv://GoXpress:B9qjcDdF4LP1uK77@cluster0.vkey5u6.mongodb.net/shipper-admin";

async function fixSettledOrders() {
    await mongoose.connect(MONGODB_URI);
    const driverId = "69b1a9c80409b2241cbbc1d2";
    console.log(`Fixing settled orders for Driver ID: ${driverId}`);
    
    // As the balance is already 0, we can safely mark all as settled
    const result = await Order.updateMany(
        { driver: new mongoose.Types.ObjectId(driverId), status: "completed", codAmount: { $gt: 0 } },
        { codSettled: true }
    );
    
    console.log(`Updated ${result.modifiedCount} orders to codSettled: true`);
    process.exit(0);
}
fixSettledOrders();
