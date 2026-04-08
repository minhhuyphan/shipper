/**
 * Database Seeder
 * Chức năng: Khởi tạo dữ liệu mẫu (admin, tài xế, đơn hàng, cấu hình giá) để phục vụ việc phát triển và thử nghiệm.
 * Thận trọng: Lệnh này xóa sạch dữ liệu cũ trước khi nạp dữ liệu mới.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config';
import { User, Order, Driver, PricingConfig, CODSettlement } from './models';

const STREETS = [
    'Nguyen Hue', 'Le Loi', 'Hai Ba Trung', 'Tran Hung Dao', 'Pham Ngu Lao',
    'Vo Van Tan', 'Nam Ky Khoi Nghia', 'Pasteur', 'Dong Khoi', 'Ly Tu Trong',
    'Nguyen Thi Minh Khai', 'Le Duan', 'Dien Bien Phu', 'Cach Mang Thang 8', 'Ba Thang Hai',
];
const NAMES_FIRST = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vo', 'Dang', 'Bui', 'Do', 'Ngo'];
const NAMES_LAST = ['An', 'Binh', 'Cuong', 'Dung', 'Hung', 'Khanh', 'Linh', 'Minh', 'Phong', 'Tam'];
const STATUSES: Array<'pending' | 'assigned' | 'picking_up' | 'delivering' | 'completed' | 'cancelled'> = [
    'completed', 'completed', 'completed', 'completed', // 40% completed
    'delivering', 'delivering', 'picking_up',            // 30% running
    'assigned', 'pending',                                // 20% waiting
    'cancelled',                                          // 10% cancelled
];

function rand<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randNum(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPhone() {
    return '09' + String(randNum(10000000, 99999999));
}

function randomDate(daysBack: number) {
    const now = Date.now();
    return new Date(now - Math.random() * daysBack * 24 * 60 * 60 * 1000);
}

async function seed() {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected. Clearing existing data...');

    await Promise.all([
        User.deleteMany({}),
        Order.deleteMany({}),
        Driver.deleteMany({}),
        PricingConfig.deleteMany({}),
        CODSettlement.deleteMany({}),
    ]);

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
        email: 'admin@shipper.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'admin',
    });

    await User.create({
        email: 'staff@shipper.com',
        password: hashedPassword,
        name: 'Staff User',
        role: 'staff',
    });

    console.log('✅ Users created');

    // Create 10 drivers
    const driverStatuses: Array<'pending' | 'approved' | 'rejected'> = [
        'approved', 'approved', 'approved', 'approved', 'approved',
        'approved', 'approved', 'pending', 'pending', 'rejected',
    ];

    const drivers = [];
    for (let i = 0; i < 10; i++) {
        const isApproved = driverStatuses[i] === 'approved';
        const driver = await Driver.create({
            name: `${rand(NAMES_FIRST)} ${rand(NAMES_LAST)}`,
            phone: randPhone(),
            vehiclePlate: `${randNum(50, 99)}A-${randNum(100, 999)}.${randNum(10, 99)}`,
            status: driverStatuses[i],
            locked: i === 9,
            documents: {
                idCardUrl: `https://picsum.photos/seed/id${i}/400/250`,
                licenseUrl: `https://picsum.photos/seed/lic${i}/400/250`,
            },
            ratingAvg: isApproved ? parseFloat((3.5 + Math.random() * 1.5).toFixed(1)) : 0,
            totalRatings: isApproved ? randNum(20, 200) : 0,
            online: isApproved && i < 5, // first 5 approved drivers are online
            lastLocation: {
                lat: 10.762622 + (Math.random() - 0.5) * 0.05,
                lng: 106.660172 + (Math.random() - 0.5) * 0.05,
                updatedAt: new Date(),
            },
            codHolding: isApproved ? randNum(0, 5) * 200000 : 0,
        });
        drivers.push(driver);
    }
    console.log('✅ 10 Drivers created');

    // Create 2 pricing configurations
    const pricing1 = await PricingConfig.create({
        version: 1,
        baseFare: 15000,
        baseDistanceKm: 2,
        pricePerKm: 5000,
        peakHourSurcharge: { startHour: 7, endHour: 9, fee: 10000 },
        bulkyItemSurcharge: 20000,
        codFee: { type: 'fixed', value: 5000 },
        services: {
            express: { enabled: true, multiplier: 1.5 },
            economy: { enabled: true, multiplier: 1.0 },
        },
        active: false,
        auditLogs: [{ action: 'created', performedBy: admin._id, performedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }],
    });

    const pricing2 = await PricingConfig.create({
        version: 2,
        baseFare: 18000,
        baseDistanceKm: 3,
        pricePerKm: 4500,
        peakHourSurcharge: { startHour: 17, endHour: 19, fee: 15000 },
        bulkyItemSurcharge: 25000,
        codFee: { type: 'percentage', value: 1.5 },
        services: {
            express: { enabled: true, multiplier: 1.8 },
            economy: { enabled: true, multiplier: 1.0 },
        },
        active: true,
        auditLogs: [{ action: 'created', performedBy: admin._id, performedAt: new Date() }],
    });
    console.log('✅ 2 Pricing configs created');

    // Create 50 orders
    const approvedDrivers = drivers.filter((d) => d.status === 'approved');
    for (let i = 0; i < 50; i++) {
        const status = rand(STATUSES);
        const distance = parseFloat((1 + Math.random() * 20).toFixed(1));
        const serviceType = Math.random() > 0.3 ? 'economy' : 'express';
        const isBulky = Math.random() > 0.8;
        const codAmount = Math.random() > 0.4 ? randNum(1, 20) * 50000 : 0;

        const baseFare = 18000;
        const extraKm = Math.max(0, distance - 3);
        const distCharge = extraKm * 4500;
        const peakSurcharge = Math.random() > 0.7 ? 15000 : 0;
        const bulkySurcharge = isBulky ? 25000 : 0;
        const multiplier = serviceType === 'express' ? 1.8 : 1.0;
        const codFee = codAmount > 0 ? Math.round((codAmount * 1.5) / 100) : 0;
        const subtotal = Math.round((baseFare + distCharge + peakSurcharge + bulkySurcharge) * multiplier);
        const total = subtotal + codFee;

        const orderDate = randomDate(30);
        const driver = status !== 'pending' ? rand(approvedDrivers) : undefined;

        const events: any[] = [
            { type: 'order_created', timestamp: orderDate },
        ];

        if (['assigned', 'picking_up', 'delivering', 'completed', 'cancelled'].includes(status)) {
            events.push({ type: 'driver_assigned', timestamp: new Date(orderDate.getTime() + 5 * 60000) });
        }
        if (['picking_up', 'delivering', 'completed'].includes(status)) {
            events.push({ type: 'driver_picking_up', timestamp: new Date(orderDate.getTime() + 15 * 60000) });
        }
        if (['delivering', 'completed'].includes(status)) {
            events.push({ type: 'picked_up', timestamp: new Date(orderDate.getTime() + 25 * 60000) });
        }
        if (status === 'completed') {
            events.push({ type: 'delivered', timestamp: new Date(orderDate.getTime() + 45 * 60000) });
        }
        if (status === 'cancelled') {
            events.push({ type: 'cancelled', timestamp: new Date(orderDate.getTime() + 10 * 60000), note: 'Customer cancelled' });
        }

        const hasComplaint = Math.random() > 0.85;

        await Order.create({
            orderCode: `ORD-${String(i + 1).padStart(5, '0')}`,
            customer: {
                name: `${rand(NAMES_FIRST)} ${rand(NAMES_LAST)}`,
                phone: randPhone(),
                address: `${randNum(1, 200)} ${rand(STREETS)}, Ho Chi Minh City`,
            },
            driver: driver?._id,
            status,
            serviceType,
            pickupAddress: `${randNum(1, 200)} ${rand(STREETS)}, District ${randNum(1, 12)}, HCMC`,
            deliveryAddress: `${randNum(1, 200)} ${rand(STREETS)}, District ${randNum(1, 12)}, HCMC`,
            distanceKm: distance,
            isBulky,
            pricingBreakdown: {
                baseFare,
                distanceCharge: Math.round(distCharge),
                peakHourSurcharge: peakSurcharge,
                bulkyItemSurcharge: bulkySurcharge,
                codFee,
                total,
            },
            codAmount,
            deliveryProofImages: status === 'completed' ? [`https://picsum.photos/seed/proof${i}/400/300`] : [],
            events,
            complaint: hasComplaint
                ? { status: rand(['open', 'in_progress', 'resolved'] as const), notes: ['Customer reported late delivery'], updatedAt: new Date() }
                : undefined,
            auditLogs: [],
            createdAt: orderDate,
        });
    }
    console.log('✅ 50 Orders created');

    // Create some COD settlements
    for (const driver of approvedDrivers.slice(0, 3)) {
        if (driver.codHolding > 0) {
            const amount = Math.min(200000, driver.codHolding);
            await CODSettlement.create({
                driver: driver._id,
                amount,
                method: rand(['cash', 'bank'] as const),
                note: 'Weekly settlement',
                createdBy: admin._id,
            });
        }
    }
    console.log('✅ COD Settlements created');

    console.log('\n🎉 Seed complete!');
    console.log('   Admin login: admin@shipper.com / admin123');
    console.log('   Staff login: staff@shipper.com / admin123');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
