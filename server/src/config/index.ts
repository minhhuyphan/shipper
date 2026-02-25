import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/shipper-admin',
    jwtSecret: process.env.JWT_SECRET || 'default-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
