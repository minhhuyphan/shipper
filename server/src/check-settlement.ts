/**
 * Settlement History Checker
 * Chức năng: Kiểm tra lịch sử các giao dịch đối soát COD của một tài xế.
 * Thành phần: Tổng hợp số liệu từ bảng CODSettlement để verify tổng số tiền đã nộp về công ty.
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { CODSettlement } from "./models/CODSettlement";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://GoXpress:B9qjcDdF4LP1uK77@cluster0.vkey5u6.mongodb.net/shipper-admin";

async function checkSettlements() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const driverId = "69b1a9c80409b2241cbbc1d2";
    const settlements = await CODSettlement.find({ driver: driverId });
    
    console.log(`Found ${settlements.length} settlement records for driver 69b1a9c80409b2241cbbc1d2`);
    
    let totalSettled = 0;
    settlements.forEach((s, i) => {
        console.log(`Settlement ${i+1}: Amount=${s.amount}, Date=${s.createdAt}`);
        totalSettled += s.amount;
    });
    
    console.log(`Total Settled Amount: ${totalSettled}`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkSettlements();
