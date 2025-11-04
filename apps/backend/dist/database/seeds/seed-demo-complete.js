import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DriverEntity } from '../../modules/drivers/entities/driver.entity.js';
import { OrderEntity } from '../../modules/orders/entities/order.entity.js';
import { RoutePlanEntity } from '../../modules/routes/entities/route-plan.entity.js';
import { TrackingPointEntity } from '../../modules/tracking/entities/tracking-point.entity.js';
import { ShiftEntity } from '../../modules/shifts/entities/shift.entity.js';
import { AuditLogEntity } from '../../common/audit/audit.entity.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery',
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: true,
});
async function seedDemoComplete() {
    console.log('🚀 Starting comprehensive demo data seeding...');
    console.log('📋 This will:');
    console.log('   1. Verify all tables exist');
    console.log('   2. Create/update demo driver with complete profile');
    console.log('   3. Create orders, route plans, tracking points, and shifts');
    console.log('   4. Link all data to demo driver\n');
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connection established');
        console.log('\n📊 Verifying database tables...');
        const tables = [
            { name: 'drivers', repo: AppDataSource.getRepository(DriverEntity) },
            { name: 'orders', repo: AppDataSource.getRepository(OrderEntity) },
            { name: 'route_plans', repo: AppDataSource.getRepository(RoutePlanEntity) },
            { name: 'tracking_points', repo: AppDataSource.getRepository(TrackingPointEntity) },
            { name: 'shifts', repo: AppDataSource.getRepository(ShiftEntity) },
            { name: 'audit_logs', repo: AppDataSource.getRepository(AuditLogEntity) },
        ];
        for (const { name, repo } of tables) {
            try {
                await repo.count();
                console.log(`   ✅ Table '${name}' exists`);
            }
            catch (error) {
                console.error(`   ❌ Table '${name}' does not exist!`);
                console.error(`   💡 Run migrations or enable synchronize in development mode`);
                throw new Error(`Table ${name} does not exist`);
            }
        }
        const driverRepo = AppDataSource.getRepository(DriverEntity);
        const orderRepo = AppDataSource.getRepository(OrderEntity);
        const routePlanRepo = AppDataSource.getRepository(RoutePlanEntity);
        const trackingRepo = AppDataSource.getRepository(TrackingPointEntity);
        const shiftRepo = AppDataSource.getRepository(ShiftEntity);
        console.log('\n👤 Step 1: Creating/Updating demo driver...');
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        let demoDriver = null;
        for (const phone of demoPhones) {
            demoDriver = await driverRepo.findOne({ where: { phone } });
            if (demoDriver) {
                console.log(`   📱 Found existing driver with phone: ${phone}`);
                break;
            }
        }
        const password = 'Pri@0110';
        const hashedPassword = await bcrypt.hash(password, 10);
        const completeProfileData = {
            password: hashedPassword,
            email: 'demo.driver@example.com',
            balance: 1250.75,
            cashInHands: 125.50,
            todaysEarning: 125.50,
            thisWeekEarning: 875.25,
            thisMonthEarning: 3250.00,
            payableBalance: 1250.75,
            withdrawAbleBalance: 1000.00,
            totalWithdrawn: 5000.00,
            totalIncentiveEarning: 150.00,
            earning: 1,
            orderCount: 342,
            todaysOrderCount: 8,
            thisWeekOrderCount: 45,
            imageFullUrl: null,
            fcmToken: null,
            identityNumber: null,
            identityType: null,
            identityImage: null,
            avgRating: 4.8,
            ratingCount: 125,
            memberSinceDays: 180,
            shiftName: 'Morning Shift',
            shiftStartTime: '08:00:00',
            shiftEndTime: '16:00:00',
        };
        if (demoDriver) {
            console.log(`   🔄 Updating existing driver...`);
            demoDriver.name = demoDriver.name || 'Demo Driver';
            demoDriver.vehicleType = demoDriver.vehicleType || 'bike';
            demoDriver.capacity = demoDriver.capacity || 5;
            demoDriver.online = true;
            if (demoDriver.latitude === null || demoDriver.longitude === null) {
                demoDriver.latitude = 12.9716;
                demoDriver.longitude = 77.5946;
            }
            if (demoDriver.lastSeenAt === null) {
                demoDriver.lastSeenAt = new Date();
            }
            if (demoDriver.phone !== '+919975008124') {
                const existingWithPreferred = await driverRepo.findOne({ where: { phone: '+919975008124' } });
                if (!existingWithPreferred) {
                    demoDriver.phone = '+919975008124';
                }
            }
            demoDriver.metadata = {
                ...completeProfileData,
                ...(demoDriver.metadata || {}),
                password: hashedPassword,
            };
            demoDriver = await driverRepo.save(demoDriver);
            console.log(`   ✅ Updated demo driver: ${demoDriver.name} (${demoDriver.phone})`);
        }
        else {
            console.log(`   ➕ Creating new demo driver...`);
            demoDriver = driverRepo.create({
                phone: '+919975008124',
                name: 'Demo Driver',
                vehicleType: 'bike',
                capacity: 5,
                online: true,
                latitude: 12.9716,
                longitude: 77.5946,
                lastSeenAt: new Date(),
                metadata: completeProfileData,
            });
            demoDriver = await driverRepo.save(demoDriver);
            console.log(`   ✅ Created demo driver: ${demoDriver.name} (${demoDriver.phone})`);
        }
        console.log(`   📋 Driver ID: ${demoDriver.id}`);
        console.log('\n⏰ Step 2: Creating shifts...');
        const existingShifts = await shiftRepo.find();
        if (existingShifts.length === 0) {
            const shifts = await shiftRepo.save([
                {
                    name: 'Morning Shift',
                    startTime: '08:00:00',
                    endTime: '16:00:00',
                    status: 1,
                    driverId: null,
                    zoneId: null,
                },
                {
                    name: 'Afternoon Shift',
                    startTime: '12:00:00',
                    endTime: '20:00:00',
                    status: 1,
                    driverId: null,
                    zoneId: null,
                },
                {
                    name: 'Evening Shift',
                    startTime: '16:00:00',
                    endTime: '00:00:00',
                    status: 1,
                    driverId: null,
                    zoneId: null,
                },
                {
                    name: 'Night Shift',
                    startTime: '20:00:00',
                    endTime: '08:00:00',
                    status: 1,
                    driverId: null,
                    zoneId: null,
                },
            ]);
            console.log(`   ✅ Created ${shifts.length} shifts`);
        }
        else {
            console.log(`   ℹ️  ${existingShifts.length} shifts already exist`);
        }
        const morningShift = await shiftRepo.findOne({ where: { name: 'Morning Shift' } });
        if (morningShift && !morningShift.driverId) {
            morningShift.driverId = demoDriver.id;
            await shiftRepo.save(morningShift);
            console.log(`   ✅ Assigned Morning Shift to demo driver`);
        }
        console.log('\n📦 Step 3: Creating orders...');
        const existingOrders = await orderRepo.find({ where: { driverId: demoDriver.id } });
        console.log(`   ℹ️  Found ${existingOrders.length} existing orders for demo driver`);
        const orders = await orderRepo.save([
            {
                externalRef: 'DEMO-PENDING-001',
                pickup: { lat: 12.9716, lng: 77.5946, address: 'Pizza Hut, MG Road, Bengaluru' },
                dropoff: { lat: 12.9558, lng: 77.6077, address: 'Prestige Tech Park, Whitefield' },
                status: 'pending',
                paymentType: 'cash_on_delivery',
                items: [{ name: 'Margherita Pizza', quantity: 1, price: 299 }],
                slaSeconds: 2700,
                trackingUrl: null,
                driverId: null,
                assignedAt: null,
                zoneId: null,
            },
            {
                externalRef: 'DEMO-PENDING-002',
                pickup: { lat: 12.9352, lng: 77.6245, address: 'McDonald\'s, Koramangala' },
                dropoff: { lat: 12.9141, lng: 77.6411, address: 'HSR Layout Sector 2' },
                status: 'pending',
                paymentType: 'prepaid',
                items: [{ name: 'Big Mac Combo', quantity: 2, price: 780 }],
                slaSeconds: 1800,
                trackingUrl: null,
                driverId: null,
                assignedAt: null,
                zoneId: null,
            },
            {
                externalRef: 'DEMO-ASSIGNED-001',
                pickup: { lat: 12.9667, lng: 77.5667, address: 'Domino\'s, Rajaji Nagar' },
                dropoff: { lat: 12.9822, lng: 77.5946, address: 'Columbia Asia Hospital, Hebbal' },
                status: 'assigned',
                paymentType: 'prepaid',
                items: [{ name: 'Pepperoni Pizza', quantity: 1, price: 399 }, { name: 'Coke', quantity: 2, price: 80 }],
                slaSeconds: 2400,
                trackingUrl: `http://localhost:3001/track/DEMO-ASSIGNED-001`,
                driverId: demoDriver.id,
                assignedAt: new Date(),
                zoneId: null,
            },
            {
                externalRef: 'DEMO-ASSIGNED-002',
                pickup: { lat: 12.9279, lng: 77.6271, address: 'KFC, Indiranagar' },
                dropoff: { lat: 12.9698, lng: 77.6469, address: 'Mantri Square Mall, Malleshwaram' },
                status: 'assigned',
                paymentType: 'cash_on_delivery',
                items: [{ name: 'Chicken Bucket', quantity: 1, price: 599 }],
                slaSeconds: 2100,
                trackingUrl: `http://localhost:3001/track/DEMO-ASSIGNED-002`,
                driverId: demoDriver.id,
                assignedAt: new Date(Date.now() - 300000),
                zoneId: null,
            },
            {
                externalRef: 'DEMO-PICKED-001',
                pickup: { lat: 12.9141, lng: 77.6411, address: 'Subway, HSR Layout' },
                dropoff: { lat: 12.9352, lng: 77.6245, address: 'Wipro Corporate Office, Sarjapur Road' },
                status: 'picked_up',
                paymentType: 'prepaid',
                items: [{ name: 'Veggie Delite Sub', quantity: 1, price: 199 }, { name: 'Cookie', quantity: 2, price: 90 }],
                slaSeconds: 1500,
                trackingUrl: `http://localhost:3001/track/DEMO-PICKED-001`,
                driverId: demoDriver.id,
                assignedAt: new Date(Date.now() - 600000),
                zoneId: null,
            },
            {
                externalRef: 'DEMO-IN-TRANSIT-001',
                pickup: { lat: 12.9822, lng: 77.5946, address: 'Starbucks, Yeshwanthpur' },
                dropoff: { lat: 12.9667, lng: 77.5667, address: 'Orion Mall, Brigade Gateway' },
                status: 'in_transit',
                paymentType: 'prepaid',
                items: [{ name: 'Cappuccino', quantity: 2, price: 320 }, { name: 'Blueberry Muffin', quantity: 1, price: 150 }],
                slaSeconds: 1200,
                trackingUrl: `http://localhost:3001/track/DEMO-IN-TRANSIT-001`,
                driverId: demoDriver.id,
                assignedAt: new Date(Date.now() - 1200000),
                zoneId: null,
            },
            {
                externalRef: 'DEMO-DELIVERED-001',
                pickup: { lat: 12.9352, lng: 77.6245, address: 'China Bowl, Koramangala' },
                dropoff: { lat: 12.9141, lng: 77.6411, address: 'Sapphire Apartments, HSR Layout' },
                status: 'delivered',
                paymentType: 'cash_on_delivery',
                items: [{ name: 'Fried Rice', quantity: 1, price: 199 }, { name: 'Manchurian', quantity: 1, price: 149 }],
                slaSeconds: 1800,
                trackingUrl: `http://localhost:3001/track/DEMO-DELIVERED-001`,
                driverId: demoDriver.id,
                assignedAt: new Date(Date.now() - 3600000),
                zoneId: null,
            },
            {
                externalRef: 'DEMO-DELIVERED-002',
                pickup: { lat: 12.9716, lng: 77.5946, address: 'Biryani House, MG Road' },
                dropoff: { lat: 12.9558, lng: 77.6077, address: 'Embassy Tech Village, Whitefield' },
                status: 'delivered',
                paymentType: 'prepaid',
                items: [{ name: 'Chicken Biryani', quantity: 1, price: 250 }, { name: 'Raita', quantity: 1, price: 40 }],
                slaSeconds: 2100,
                trackingUrl: `http://localhost:3001/track/DEMO-DELIVERED-002`,
                driverId: demoDriver.id,
                assignedAt: new Date(Date.now() - 5400000),
                zoneId: null,
            },
            {
                externalRef: 'DEMO-CANCELLED-001',
                pickup: { lat: 12.9667, lng: 77.5667, address: 'French Fries Shop, Rajaji Nagar' },
                dropoff: { lat: 12.9822, lng: 77.5946, address: 'Indian Institute of Science, Malleswaram' },
                status: 'cancelled',
                paymentType: 'prepaid',
                items: [{ name: 'Large Fries', quantity: 2, price: 180 }],
                slaSeconds: 1500,
                trackingUrl: null,
                driverId: null,
                assignedAt: null,
                zoneId: null,
            },
        ]);
        console.log(`   ✅ Created ${orders.length} orders`);
        console.log(`   📊 Status breakdown:`);
        const statusCounts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`      ${status}: ${count}`);
        });
        console.log('\n🗺️  Step 4: Creating route plans...');
        await routePlanRepo.delete({ driverId: demoDriver.id });
        const assignedOrders = orders.filter(o => o.driverId === demoDriver.id && ['assigned', 'picked_up', 'in_transit'].includes(o.status));
        const routePlans = await routePlanRepo.save(assignedOrders.map((order, index) => ({
            driverId: demoDriver.id,
            orderId: order.id,
            stops: [
                { lat: order.pickup.lat, lng: order.pickup.lng, orderId: order.id, eta: '600' },
                { lat: order.dropoff.lat, lng: order.dropoff.lng, orderId: order.id, eta: '1800' },
            ],
            totalDistanceKm: 5.5 + Math.random() * 3,
            etaPerStop: ['600', '1800'],
            provider: 'optimoroute',
            rawResponse: {
                status: 'success',
                optimized: true,
                orderId: order.id,
            },
        })));
        console.log(`   ✅ Created ${routePlans.length} route plans for demo driver`);
        console.log('\n📍 Step 5: Creating tracking points...');
        await trackingRepo.delete({ driverId: demoDriver.id });
        const trackingPoints = [];
        const now = Date.now();
        const deliveredOrders = orders.filter(o => o.status === 'delivered' && o.driverId === demoDriver.id);
        for (const order of deliveredOrders) {
            const startTime = now - 3600000;
            const numPoints = 15;
            for (let i = 0; i < numPoints; i++) {
                const progress = i / numPoints;
                const lat = order.pickup.lat + (order.dropoff.lat - order.pickup.lat) * progress + (Math.random() - 0.5) * 0.001;
                const lng = order.pickup.lng + (order.dropoff.lng - order.pickup.lng) * progress + (Math.random() - 0.5) * 0.001;
                trackingPoints.push({
                    orderId: order.id,
                    driverId: demoDriver.id,
                    latitude: lat,
                    longitude: lng,
                    speed: 25 + Math.random() * 10,
                    heading: 135 + Math.random() * 90,
                    recordedAt: new Date(startTime + i * 240000),
                });
            }
        }
        const inTransitOrders = orders.filter(o => o.status === 'in_transit' && o.driverId === demoDriver.id);
        for (const order of inTransitOrders) {
            const startTime = now - 1200000;
            const numPoints = 8;
            for (let i = 0; i < numPoints; i++) {
                const progress = i / numPoints;
                const lat = order.pickup.lat + (order.dropoff.lat - order.pickup.lat) * progress + (Math.random() - 0.5) * 0.001;
                const lng = order.pickup.lng + (order.dropoff.lng - order.pickup.lng) * progress + (Math.random() - 0.5) * 0.001;
                trackingPoints.push({
                    orderId: order.id,
                    driverId: demoDriver.id,
                    latitude: lat,
                    longitude: lng,
                    speed: 30 + Math.random() * 15,
                    heading: 225 + Math.random() * 90,
                    recordedAt: new Date(startTime + i * 150000),
                });
            }
        }
        if (trackingPoints.length > 0) {
            await trackingRepo.save(trackingPoints);
            console.log(`   ✅ Created ${trackingPoints.length} tracking points`);
        }
        else {
            console.log(`   ℹ️  No tracking points created (no delivered/in-transit orders)`);
        }
        console.log('\n🎉 Demo data seeding complete!');
        console.log('==========================================');
        console.log('📊 Final Statistics:');
        console.log(`   👤 Driver: ${demoDriver.name} (${demoDriver.phone})`);
        console.log(`      ID: ${demoDriver.id}`);
        console.log(`      Online: ${demoDriver.online}`);
        console.log(`      Capacity: ${demoDriver.capacity}`);
        console.log(`      Location: ${demoDriver.latitude}, ${demoDriver.longitude}`);
        const finalOrderCount = await orderRepo.count({ where: { driverId: demoDriver.id } });
        const finalRoutePlanCount = await routePlanRepo.count({ where: { driverId: demoDriver.id } });
        const finalTrackingPointCount = await trackingRepo.count({ where: { driverId: demoDriver.id } });
        const finalShiftCount = await shiftRepo.count({ where: { driverId: demoDriver.id } });
        console.log(`   📦 Orders: ${finalOrderCount}`);
        console.log(`   🗺️  Route Plans: ${finalRoutePlanCount}`);
        console.log(`   📍 Tracking Points: ${finalTrackingPointCount}`);
        console.log(`   ⏰ Shifts: ${finalShiftCount}`);
        console.log('==========================================');
        console.log('\n🔐 Demo Driver Credentials:');
        console.log(`   Phone: ${demoDriver.phone} or 9975008124`);
        console.log(`   Password: ${password}`);
        console.log(`   OTP Code: 123456 (in development)`);
        console.log('\n📋 Created Orders:');
        orders.forEach(order => {
            if (order.driverId === demoDriver.id) {
                console.log(`   - ${order.externalRef}: ${order.status} (${order.paymentType})`);
            }
        });
        await AppDataSource.destroy();
        console.log('\n✅ Database connection closed');
        console.log('✅ All tables verified and demo data created successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during seeding:', error);
        if (error instanceof Error) {
            console.error('   Error message:', error.message);
            console.error('   Stack:', error.stack);
        }
        await AppDataSource.destroy();
        process.exit(1);
    }
}
seedDemoComplete();
