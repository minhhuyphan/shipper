import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { Order, Driver, CODSettlement } from "./models";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://GoXpress:B9qjcDdF4LP1uK77@cluster0.vkey5u6.mongodb.net/shipper-admin";

async function fixCOD() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const driverId = "69b1a9c80409b2241cbbc1d2";
    console.log(`Fixing COD for driver ${driverId}`);
    
    // 1. Calculate total COD from completed orders
    const orders = await Order.find({ driver: driverId, status: "completed" });
    const totalCOD = orders.reduce((sum, o) => sum + (o.codAmount || 0), 0);
    console.log(`Total COD from ${orders.length} completed orders: ${totalCOD}`);

    // 2. Calculate total settled COD
    const settlements = await CODSettlement.find({ driver: driverId });
    const totalSettled = settlements.reduce((sum, s) => sum + (s.amount || 0), 0);
    console.log(`Total Settled Amount: ${totalSettled}`);

    // 3. The correct balance should be totalCOD - totalSettled
    const correctBalance = totalCOD - totalSettled;
    console.log(`Setting driver codHolding to: ${correctBalance}`);

    // 4. Update the driver record
    const result = await Driver.findByIdAndUpdate(driverId, { 
        codHolding: correctBalance 
    }, { new: true });

    if (result) {
        console.log(`✅ Success! Driver ${result.name} now has codHolding: ${result.codHolding}`);
    } else {
        console.log("❌ Driver not found!");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixCOD();
