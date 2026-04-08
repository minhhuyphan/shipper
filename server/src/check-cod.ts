/**
 * COD Diagnostic Tool
 * Chức năng: Kiểm tra và in báo cáo chi tiết về sự sai lệch tiền COD của từng tài xế.
 * Thành phần: So sánh codHolding trong bản ghi Driver và tổng codAmount từ các Order hoàn thành chưa đối soát.
 */
import mongoose from "mongoose";
import { Driver, Order } from "./models";
import dotenv from "dotenv";
import path from "path";

// Load .env from parent dir
dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkCod() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/shipper-admin";
  console.log("Connecting to:", uri.replace(/:[^:@]+@/, ":****@"));
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");

  // Find all drivers with codHolding > 0
  const drivers = await Driver.find({ codHolding: { $gt: 0 } });
  console.log(`Found ${drivers.length} drivers with codHolding > 0`);

  for (const driver of drivers) {
    // Find all completed orders with COD for this driver that are NOT settled
    const pendingOrders = await Order.find({
      driver: driver._id,
      status: "completed",
      codAmount: { $gt: 0 },
      codSettled: { $ne: true }
    });

    const calculatedCodHolding = pendingOrders.reduce((sum, o) => sum + (o.codAmount || 0), 0);
    const diff = driver.codHolding - calculatedCodHolding;

    console.log(`\n---------------------------------------------------------`);
    console.log(`Driver: ${driver.name} (${driver.phone})`);
    console.log(`ID: ${driver._id}`);
    console.log(`Stored codHolding (Home):   ${driver.codHolding.toLocaleString()}đ`);
    console.log(`Calculated (Quản Lý COD):    ${calculatedCodHolding.toLocaleString()}đ`);
    console.log(`Difference:                  ${diff.toLocaleString()}đ`);
    
    if (pendingOrders.length > 0) {
      console.log("Pending Orders Details:");
      pendingOrders.forEach(o => {
        console.log(` - ${o.orderCode.padEnd(25)} | Amount: ${o.codAmount.toString().padStart(8)} | UpdatedAt: ${o.updatedAt}`);
      });
    } else {
      console.log("No pending orders found in Order collection.");
    }
    
    if (diff !== 0) {
      console.log(`⚠️ MISMATCH DETECTED for ${driver.name}`);
    }
  }

  await mongoose.disconnect();
}

checkCod().catch(err => {
    console.error("❌ FAILED:", err.message);
    process.exit(1);
});
