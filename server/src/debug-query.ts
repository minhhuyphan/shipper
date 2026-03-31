import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://GoXpress:B9qjcDdF4LP1uK77@cluster0.vkey5u6.mongodb.net/shipper-admin";

async function debugQuery() {
    await mongoose.connect(MONGODB_URI);
    
    // Define temporary schemas to avoid model not found
    const Order = mongoose.models.Order || mongoose.model("Order", new mongoose.Schema({
        driver: mongoose.Schema.Types.Mixed,
        status: String,
        codAmount: Number
    }));

    const driverId = "69b1a9c80409b2241cbbc1d2";
    console.log(`Debugging query for Driver ID: ${driverId}`);
    
    const count = await Order.countDocuments({
        driver: new mongoose.Types.ObjectId(driverId),
        status: "completed",
        codAmount: { $gt: 0 }
    });
    console.log(`Count with ObjectId: ${count}`);
    
    const countStr = await Order.countDocuments({
        driver: driverId,
        status: "completed",
        codAmount: { $gt: 0 }
    });
    console.log(`Count with String: ${countStr}`);
    
    const sample = await Order.findOne({ status: "completed", codAmount: { $gt: 0 } });
    if (sample) {
        console.log(`Sample driver field value: ${sample.driver}`);
        console.log(`Sample driver field type: ${typeof sample.driver}`);
        console.log(`Sample is ObjectId: ${sample.driver instanceof mongoose.Types.ObjectId}`);
    }
    
    process.exit(0);
}
debugQuery();
