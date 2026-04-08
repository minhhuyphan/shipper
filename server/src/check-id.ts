/**
 * ID Verification Tool
 * Chức năng: Kiểm tra một ID bất kỳ thuộc về User hay Driver trong hệ thống.
 * Thành phần: Tìm kiếm chéo giữa bảng User và Driver để xác định vai trò của ID đó.
 */
import mongoose from "mongoose";
import { User, Driver } from "./models";

const MONGODB_URI = "mongodb+srv://GoXpress:B9qjcDdF4LP1uK77@cluster0.vkey5u6.mongodb.net/shipper-admin";

async function checkId() {
    await mongoose.connect(MONGODB_URI);
    const id = "69b1a9c70409b2241cbbc1cf";
    console.log(`Checking ID: ${id}`);
    
    const user = await User.findById(id);
    console.log(`User found: ${user ? user.name + " (" + (user as any).phone + ")" : "NO"}`);
    
    const driver = await Driver.findById(id);
    console.log(`Driver found: ${driver ? driver.name + " (" + (driver as any).phone + ")" : "NO"}`);
    
    if (user && !driver) {
        console.log(`Searching driver by phone: ${(user as any).phone}`);
        const dByPhone = await Driver.findOne({ phone: (user as any).phone });
        console.log(`Driver found by phone: ${dByPhone ? dByPhone._id : "NO"}`);
    }
    
    process.exit(0);
}
checkId();
