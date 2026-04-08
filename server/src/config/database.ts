/**
 * Database Connection Config
 * Chức năng: Thiết lập kết nối giữa ứng dụng và MongoDB bằng Mongoose.
 */
import mongoose from 'mongoose';
import { config } from './index';

export const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
