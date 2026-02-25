import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { auth } from './middleware/auth';
import { swaggerSpec } from './swagger';

// Routes
import authRoutes from './routes/auth';
import statsRoutes from './routes/stats';
import orderRoutes from './routes/orders';
import pricingRoutes from './routes/pricing';
import driverRoutes from './routes/drivers';

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new SocketIOServer(server, {
    cors: { origin: config.clientUrl, methods: ['GET', 'POST'] },
});

// Middleware
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/admin/stats', auth, statsRoutes);
app.use('/api/admin/orders', auth, orderRoutes);
app.use('/api/admin/pricing', auth, pricingRoutes);
app.use('/api/admin/drivers', auth, driverRoutes);

// Error handler
app.use(errorHandler);

// Socket.IO events
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Make io available to routes
app.set('io', io);

// Start
const start = async () => {
    await connectDB();
    server.listen(config.port, () => {
        console.log(`🚀 Server running on http://localhost:${config.port}`);
        console.log(`📚 Swagger docs at http://localhost:${config.port}/api-docs`);
    });
};

start().catch(console.error);

export { app, io };
