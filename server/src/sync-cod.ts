/**
 * COD Sync Utility
 * Chức năng: Đồng bộ hóa lại số dư COD đang giữ của tài xế dựa trên các đơn hàng thực tế trong database.
 * Cách dùng: Chạy độc lập khi phát hiện sai lệch số liệu COD giữa màn hình Home và Quản lý COD.
 */
import mongoose from "mongoose";
import { Driver, Order } from "./models";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function syncCod() {
  const uri = process.env.MONGODB_URI!;
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");

  // Filter for specific driver if needed, or all drivers with mismatches
  const drivers = await Driver.find({ codHolding: { $gt: 0 } });
  
  console.log(`Checking ${drivers.length} drivers for COD sync...`);

  for (const driver of drivers) {
    const pendingOrders = await Order.find({
      driver: driver._id,
      status: "completed",
      codAmount: { $gt: 0 },
      codSettled: { $ne: true }
    });

    const actualCodHolding = pendingOrders.reduce((sum, o) => sum + (o.codAmount || 0), 0);
    
    if (driver.codHolding !== actualCodHolding) {
      console.log(`\n🔄 Syncing ${driver.name} (${driver.phone})`);
      console.log(`   Old Value: ${driver.codHolding.toLocaleString()}đ`);
      console.log(`   New Value: ${actualCodHolding.toLocaleString()}đ (based on ${pendingOrders.length} orders)`);
      
      driver.codHolding = actualCodHolding;
      await driver.save();
      console.log("   ✅ Saved.");
    }
  }

  console.log("\nAll done.");
  await mongoose.disconnect();
}

syncCod().catch(console.error);
