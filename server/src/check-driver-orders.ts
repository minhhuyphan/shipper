import mongoose from "mongoose";
import { Driver, Order } from "./models";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkDriverOrders() {
  const uri = process.env.MONGODB_URI!;
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");

  const driverPhone = "0987654321";
  const driver = await Driver.findOne({ phone: driverPhone });
  
  if (!driver) {
    console.log("Driver not found");
    return;
  }

  console.log(`\nDriver: ${driver.name} (${driver._id})`);
  console.log(`Stored codHolding: ${driver.codHolding}`);

  const orders = await Order.find({ driver: driver._id });
  console.log(`Found ${orders.length} orders total for this driver.`);

  console.log("\nRecent Orders:");
  orders.slice(-20).forEach(o => {
    console.log(` - Code: ${o.orderCode.padEnd(25)} | Status: ${o.status.padEnd(12)} | COD: ${o.codAmount.toString().padStart(8)} | Settled: ${o.codSettled}`);
  });

  await mongoose.disconnect();
}

checkDriverOrders().catch(console.error);
