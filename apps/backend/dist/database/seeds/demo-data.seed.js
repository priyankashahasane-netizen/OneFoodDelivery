import { DriverEntity } from '../../modules/drivers/entities/driver.entity';
import { OrderEntity } from '../../modules/orders/entities/order.entity';
import { RoutePlanEntity } from '../../modules/routes/entities/route-plan.entity';
import { TrackingPointEntity } from '../../modules/tracking/entities/tracking-point.entity';
import { ShiftEntity } from '../../modules/shifts/entities/shift.entity';
export async function seedDemoData(dataSource) {
    console.log('🌱 Starting demo data seeding...');
    const driverRepo = dataSource.getRepository(DriverEntity);
    const orderRepo = dataSource.getRepository(OrderEntity);
    const routePlanRepo = dataSource.getRepository(RoutePlanEntity);
    const trackingRepo = dataSource.getRepository(TrackingPointEntity);
    const shiftRepo = dataSource.getRepository(ShiftEntity);
    console.log('🗑️  Clearing existing demo data...');
    await trackingRepo.delete({});
    await routePlanRepo.delete({});
    await orderRepo.delete({});
    await driverRepo.delete({});
    console.log('👤 Creating demo drivers...');
    const drivers = await driverRepo.save([
        {
            name: 'John Smith',
            phone: '+1234567890',
            vehicleType: 'motorcycle',
            capacity: 5,
            online: true,
            latitude: 12.9716,
            longitude: 77.5946,
            lastSeenAt: new Date(),
            metadata: {
                email: 'john.smith@example.com',
                rating: 4.8,
                completedOrders: 245,
            },
        },
        {
            name: 'Maria Garcia',
            phone: '+1234567891',
            vehicleType: 'scooter',
            capacity: 3,
            online: false,
            latitude: 12.9352,
            longitude: 77.6245,
            lastSeenAt: new Date(Date.now() - 3600000),
            metadata: {
                email: 'maria.garcia@example.com',
                rating: 4.9,
                completedOrders: 312,
            },
        },
        {
            name: 'Rajesh Kumar',
            phone: '+919876543210',
            vehicleType: 'bicycle',
            capacity: 2,
            online: true,
            latitude: 12.9141,
            longitude: 77.6411,
            lastSeenAt: new Date(),
            metadata: {
                email: 'rajesh.kumar@example.com',
                rating: 4.7,
                completedOrders: 189,
            },
        },
        {
            name: 'Sarah Johnson',
            phone: '+15551234567',
            vehicleType: 'car',
            capacity: 8,
            online: true,
            latitude: 12.9667,
            longitude: 77.5667,
            lastSeenAt: new Date(),
            metadata: {
                email: 'sarah.johnson@example.com',
                rating: 4.6,
                completedOrders: 156,
            },
        },
        {
            name: 'Ahmed Ali',
            phone: '+971501234567',
            vehicleType: 'motorcycle',
            capacity: 4,
            online: false,
            latitude: 12.9279,
            longitude: 77.6271,
            lastSeenAt: new Date(Date.now() - 7200000),
            metadata: {
                email: 'ahmed.ali@example.com',
                rating: 4.5,
                completedOrders: 98,
            },
        },
        {
            name: 'Chen Wei',
            phone: '+8613812345678',
            vehicleType: 'scooter',
            capacity: 3,
            online: true,
            latitude: 12.9558,
            longitude: 77.6077,
            lastSeenAt: new Date(),
            metadata: {
                email: 'chen.wei@example.com',
                rating: 4.9,
                completedOrders: 421,
            },
        },
        {
            name: 'Emily Brown',
            phone: '+447911123456',
            vehicleType: 'bicycle',
            capacity: 2,
            online: true,
            latitude: 12.9822,
            longitude: 77.5946,
            lastSeenAt: new Date(),
            metadata: {
                email: 'emily.brown@example.com',
                rating: 4.8,
                completedOrders: 267,
            },
        },
        {
            name: 'Carlos Rodriguez',
            phone: '+34612345678',
            vehicleType: 'motorcycle',
            capacity: 5,
            online: false,
            latitude: 12.9698,
            longitude: 77.6469,
            lastSeenAt: new Date(Date.now() - 1800000),
            metadata: {
                email: 'carlos.rodriguez@example.com',
                rating: 4.7,
                completedOrders: 203,
            },
        },
        {
            name: 'Priya Sharma',
            phone: '+919999888877',
            vehicleType: 'scooter',
            capacity: 3,
            online: true,
            latitude: 12.9352,
            longitude: 77.6245,
            lastSeenAt: new Date(),
            metadata: {
                email: 'priya.sharma@example.com',
                rating: 4.9,
                completedOrders: 378,
            },
        },
        {
            name: 'Michael Chen',
            phone: '+16505551234',
            vehicleType: 'car',
            capacity: 10,
            online: true,
            latitude: 12.9141,
            longitude: 77.6411,
            lastSeenAt: new Date(),
            metadata: {
                email: 'michael.chen@example.com',
                rating: 4.6,
                completedOrders: 134,
            },
        },
    ]);
    console.log(`✅ Created ${drivers.length} drivers`);
    console.log('📦 Creating demo orders...');
    const orders = await orderRepo.save([
        {
            externalRef: 'ZOMATO-12345',
            pickup: {
                lat: 12.9716,
                lng: 77.5946,
                address: 'Pizza Hut, MG Road, Bengaluru',
            },
            dropoff: {
                lat: 12.9558,
                lng: 77.6077,
                address: 'Prestige Tech Park, Kadubeesanahalli, Bengaluru',
            },
            status: 'pending',
            paymentType: 'cash',
            items: [
                { name: 'Margherita Pizza', quantity: 1, price: 299 },
                { name: 'Garlic Bread', quantity: 1, price: 99 },
            ],
            slaSeconds: 2700,
            trackingUrl: null,
        },
        {
            externalRef: 'SWIGGY-67890',
            pickup: {
                lat: 12.9352,
                lng: 77.6245,
                address: 'McDonald\'s, Koramangala, Bengaluru',
            },
            dropoff: {
                lat: 12.9141,
                lng: 77.6411,
                address: 'Sobha Apartments, HSR Layout, Bengaluru',
            },
            status: 'pending',
            paymentType: 'online',
            items: [
                { name: 'Big Mac Combo', quantity: 2, price: 780 },
            ],
            slaSeconds: 1800,
            trackingUrl: null,
        },
        {
            externalRef: 'UBER-23456',
            pickup: {
                lat: 12.9667,
                lng: 77.5667,
                address: 'Domino\'s, Rajaji Nagar, Bengaluru',
            },
            dropoff: {
                lat: 12.9822,
                lng: 77.5946,
                address: 'Columbia Asia Hospital, Hebbal, Bengaluru',
            },
            status: 'assigned',
            paymentType: 'online',
            items: [
                { name: 'Pepperoni Pizza', quantity: 1, price: 399 },
                { name: 'Coke', quantity: 2, price: 80 },
            ],
            slaSeconds: 2400,
            trackingUrl: `http://localhost:3001/track/ORDER-3`,
            driverId: drivers[0].id,
            assignedAt: new Date(),
        },
        {
            externalRef: 'DUNZO-34567',
            pickup: {
                lat: 12.9279,
                lng: 77.6271,
                address: 'KFC, Indiranagar, Bengaluru',
            },
            dropoff: {
                lat: 12.9698,
                lng: 77.6469,
                address: 'Mantri Square Mall, Malleshwaram, Bengaluru',
            },
            status: 'assigned',
            paymentType: 'cash',
            items: [
                { name: 'Chicken Bucket', quantity: 1, price: 599 },
            ],
            slaSeconds: 2100,
            trackingUrl: `http://localhost:3001/track/ORDER-4`,
            driverId: drivers[2].id,
            assignedAt: new Date(),
        },
        {
            externalRef: 'ZOMATO-45678',
            pickup: {
                lat: 12.9141,
                lng: 77.6411,
                address: 'Subway, HSR Layout, Bengaluru',
            },
            dropoff: {
                lat: 12.9352,
                lng: 77.6245,
                address: 'Wipro Corporate Office, Sarjapur Road, Bengaluru',
            },
            status: 'picked_up',
            paymentType: 'online',
            items: [
                { name: 'Veggie Delite Sub', quantity: 1, price: 199 },
                { name: 'Cookie', quantity: 2, price: 90 },
            ],
            slaSeconds: 1500,
            trackingUrl: `http://localhost:3001/track/ORDER-5`,
            driverId: drivers[0].id,
            assignedAt: new Date(Date.now() - 600000),
        },
        {
            externalRef: 'SWIGGY-56789',
            pickup: {
                lat: 12.9558,
                lng: 77.6077,
                address: 'Burger King, Whitefield, Bengaluru',
            },
            dropoff: {
                lat: 12.9716,
                lng: 77.5946,
                address: 'Bangalore Palace, Vasanth Nagar, Bengaluru',
            },
            status: 'picked_up',
            paymentType: 'cash',
            items: [
                { name: 'Whopper Meal', quantity: 1, price: 299 },
            ],
            slaSeconds: 1800,
            trackingUrl: `http://localhost:3001/track/ORDER-6`,
            driverId: drivers[5].id,
            assignedAt: new Date(Date.now() - 900000),
        },
        {
            externalRef: 'UBER-67890',
            pickup: {
                lat: 12.9822,
                lng: 77.5946,
                address: 'Starbucks, Yeshwanthpur, Bengaluru',
            },
            dropoff: {
                lat: 12.9667,
                lng: 77.5667,
                address: 'Orion Mall, Brigade Gateway, Bengaluru',
            },
            status: 'out_for_delivery',
            paymentType: 'online',
            items: [
                { name: 'Cappuccino', quantity: 2, price: 320 },
                { name: 'Blueberry Muffin', quantity: 1, price: 150 },
            ],
            slaSeconds: 1200,
            trackingUrl: `http://localhost:3001/track/ORDER-7`,
            driverId: drivers[3].id,
            assignedAt: new Date(Date.now() - 1200000),
        },
        {
            externalRef: 'DUNZO-78901',
            pickup: {
                lat: 12.9698,
                lng: 77.6469,
                address: 'Taco Bell, JP Nagar, Bengaluru',
            },
            dropoff: {
                lat: 12.9279,
                lng: 77.6271,
                address: 'Infosys Campus, Electronic City, Bengaluru',
            },
            status: 'out_for_delivery',
            paymentType: 'online',
            items: [
                { name: 'Burrito Supreme', quantity: 2, price: 540 },
            ],
            slaSeconds: 1500,
            trackingUrl: `http://localhost:3001/track/ORDER-8`,
            driverId: drivers[6].id,
            assignedAt: new Date(Date.now() - 1800000),
        },
        {
            externalRef: 'ZOMATO-89012',
            pickup: {
                lat: 12.9352,
                lng: 77.6245,
                address: 'China Bowl, Koramangala, Bengaluru',
            },
            dropoff: {
                lat: 12.9141,
                lng: 77.6411,
                address: 'Sapphire Apartments, HSR Layout, Bengaluru',
            },
            status: 'delivered',
            paymentType: 'cash',
            items: [
                { name: 'Fried Rice', quantity: 1, price: 199 },
                { name: 'Manchurian', quantity: 1, price: 149 },
            ],
            slaSeconds: 1800,
            trackingUrl: `http://localhost:3001/track/ORDER-9`,
            driverId: drivers[0].id,
            assignedAt: new Date(Date.now() - 3600000),
        },
        {
            externalRef: 'SWIGGY-90123',
            pickup: {
                lat: 12.9716,
                lng: 77.5946,
                address: 'Biryani House, MG Road, Bengaluru',
            },
            dropoff: {
                lat: 12.9558,
                lng: 77.6077,
                address: 'Embassy Tech Village, Devarabisanahalli, Bengaluru',
            },
            status: 'delivered',
            paymentType: 'online',
            items: [
                { name: 'Chicken Biryani', quantity: 1, price: 250 },
                { name: 'Raita', quantity: 1, price: 40 },
            ],
            slaSeconds: 2100,
            trackingUrl: `http://localhost:3001/track/ORDER-10`,
            driverId: drivers[2].id,
            assignedAt: new Date(Date.now() - 5400000),
        },
        {
            externalRef: 'UBER-01234',
            pickup: {
                lat: 12.9667,
                lng: 77.5667,
                address: 'French Fries Shop, Rajaji Nagar, Bengaluru',
            },
            dropoff: {
                lat: 12.9822,
                lng: 77.5946,
                address: 'Indian Institute of Science, Malleswaram, Bengaluru',
            },
            status: 'cancelled',
            paymentType: 'online',
            items: [
                { name: 'Large Fries', quantity: 2, price: 180 },
            ],
            slaSeconds: 1500,
            trackingUrl: null,
            driverId: null,
            assignedAt: null,
        },
    ]);
    console.log(`✅ Created ${orders.length} orders`);
    console.log('🗺️  Creating route plans...');
    const routePlans = await routePlanRepo.save([
        {
            driverId: drivers[0].id,
            orderId: orders[2].id,
            stops: [
                { lat: 12.9667, lng: 77.5667, orderId: orders[2].id, eta: '600' },
                { lat: 12.9822, lng: 77.5946, orderId: orders[2].id, eta: '1800' },
            ],
            totalDistanceKm: 8.5,
            etaPerStop: ['600', '1800'],
            provider: 'optimoroute',
            rawResponse: {
                status: 'success',
                optimized: true,
            },
        },
        {
            driverId: drivers[0].id,
            orderId: orders[4].id,
            stops: [
                { lat: 12.9141, lng: 77.6411, orderId: orders[4].id, eta: '300' },
                { lat: 12.9352, lng: 77.6245, orderId: orders[4].id, eta: '900' },
            ],
            totalDistanceKm: 4.2,
            etaPerStop: ['300', '900'],
            provider: 'optimoroute',
            rawResponse: {
                status: 'success',
                optimized: true,
            },
        },
        {
            driverId: drivers[2].id,
            orderId: orders[3].id,
            stops: [
                { lat: 12.9279, lng: 77.6271, orderId: orders[3].id, eta: '480' },
                { lat: 12.9698, lng: 77.6469, orderId: orders[3].id, eta: '1440' },
            ],
            totalDistanceKm: 6.8,
            etaPerStop: ['480', '1440'],
            provider: 'optimoroute',
            rawResponse: {
                status: 'success',
                optimized: true,
            },
        },
    ]);
    console.log(`✅ Created ${routePlans.length} route plans`);
    console.log('📍 Creating tracking points...');
    const now = Date.now();
    const trackingPoints = [];
    const trail1StartTime = now - 3600000;
    for (let i = 0; i < 20; i++) {
        trackingPoints.push({
            orderId: orders[8].id,
            driverId: drivers[0].id,
            latitude: 12.9352 + (12.9141 - 12.9352) * (i / 20) + (Math.random() - 0.5) * 0.001,
            longitude: 77.6245 + (77.6411 - 77.6245) * (i / 20) + (Math.random() - 0.5) * 0.001,
            speed: 25 + Math.random() * 10,
            heading: 135,
            recordedAt: new Date(trail1StartTime + i * 120000),
        });
    }
    const trail2StartTime = now - 1200000;
    for (let i = 0; i < 10; i++) {
        trackingPoints.push({
            orderId: orders[6].id,
            driverId: drivers[3].id,
            latitude: 12.9822 + (12.9667 - 12.9822) * (i / 10) + (Math.random() - 0.5) * 0.001,
            longitude: 77.5946 + (77.5667 - 77.5946) * (i / 10) + (Math.random() - 0.5) * 0.001,
            speed: 30 + Math.random() * 15,
            heading: 225,
            recordedAt: new Date(trail2StartTime + i * 120000),
        });
    }
    await trackingRepo.save(trackingPoints);
    console.log(`✅ Created ${trackingPoints.length} tracking points`);
    console.log('⏰ Creating shifts...');
    const existingShifts = await shiftRepo.count();
    if (existingShifts === 0) {
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
            {
                name: 'Full Day Shift',
                startTime: '06:00:00',
                endTime: '22:00:00',
                status: 1,
                driverId: null,
                zoneId: null,
            },
        ]);
        console.log(`✅ Created ${shifts.length} shifts`);
    }
    else {
        console.log(`ℹ️  ${existingShifts} shifts already exist, skipping creation`);
    }
    console.log('\n🎉 Demo data seeding complete!');
    console.log('==========================================');
    console.log(`👤 Drivers: ${drivers.length}`);
    console.log(`📦 Orders: ${orders.length}`);
    console.log(`🗺️  Route Plans: ${routePlans.length}`);
    console.log(`📍 Tracking Points: ${trackingPoints.length}`);
    const shiftCount = await shiftRepo.count();
    console.log(`⏰ Shifts: ${shiftCount}`);
    console.log('==========================================\n');
    console.log('📱 Demo Driver Credentials:');
    console.log('1. John Smith (Online, 5 capacity)');
    console.log('   Phone: +1234567890');
    console.log('   OTP: 123456');
    console.log('');
    console.log('2. Maria Garcia (Offline, 3 capacity)');
    console.log('   Phone: +1234567891');
    console.log('   OTP: 123456');
    console.log('');
    console.log('3. Rajesh Kumar (Online, 2 capacity)');
    console.log('   Phone: +919876543210');
    console.log('   OTP: 123456');
    console.log('==========================================\n');
    console.log('🔗 Tracking URLs (for testing):');
    orders
        .filter((o) => o.trackingUrl)
        .slice(0, 5)
        .forEach((o) => {
        console.log(`${o.externalRef}: ${o.trackingUrl}`);
    });
    console.log('==========================================\n');
}
