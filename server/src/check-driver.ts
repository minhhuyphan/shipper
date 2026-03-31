import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { Driver } from "./models/Driver";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://GoXpress:B9qjcDdF4LP1uK77@cluster0.vkey5u6.mongodb.net/shipper-admin";

async function checkDriver() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const driverId = "69b1a9c80409b2241cbbc1d2";
    const driver = await Driver.findById(driverId);
    
    console.log(driver ? `Driver COD Holding: ${driver.codHolding}` : "Driver not found");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkDriver();
