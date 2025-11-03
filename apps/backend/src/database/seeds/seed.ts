import { DataSource } from 'typeorm';
import { DriverEntity } from '../../modules/drivers/entities/driver.entity';
import { OrderEntity } from '../../modules/orders/entities/order.entity';
import { RoutePlanEntity } from '../../modules/routes/entities/route-plan.entity';
import { TrackingPointEntity } from '../../modules/tracking/entities/tracking-point.entity';

/**
 * Seed script to populate database with demo data
 * Run with: npm run seed
 */

const demoDrivers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'John Doe',
    phone: '+1234567890',
    vehicleType: 'bike',
    capacity: 3,
    online: true,
    latitude: 12.9716,
    longitude: 77.5946,
    ipAddress: '192.168.1.1',
    lastSeenAt: new Date(),
    zoneId: 'zone-bangalore-central',
    metadata: { rating: 4.8, totalDeliveries: 150 },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Jane Smith',
    phone: '+1234567891',
    vehicleType: 'scooter',
    capacity: 2,
    online: true,
    latitude: 12.9352,
    longitude: 77.6245,
    ipAddress: '192.168.1.2',
    lastSeenAt: new Date(),
    zoneId: 'zone-bangalore-east',
    metadata: { rating: 4.9, totalDeliveries: 230 },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Mike Johnson',
    phone: '+1234567892',
    vehicleType: 'car',
    capacity: 5,
    online: false,
    latitude: 12.9141,
    longitude: 77.6411,
    ipAddress: '192.168.1.3',
    lastSeenAt: new Date(Date.now() - 3600000), // 1 hour ago
    zoneId: 'zone-bangalore-south',
    metadata: { rating: 4.7, totalDeliveries: 180 },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Sarah Williams',
    phone: '+1234567893',
    vehicleType: 'bike',
    capacity: 3,
    online: true,
    latitude: 13.0358,
    longitude: 77.5970,
    ipAddress: '192.168.1.4',
    lastSeenAt: new Date(),
    zoneId: 'zone-bangalore-north',
    metadata: { rating: 4.6, totalDeliveries: 95 },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'David Brown',
    phone: '+1234567894',
    vehicleType: 'scooter',
    capacity: 2,
    online: false,
    latitude: 12.8456,
    longitude: 77.6630,
    ipAddress: '192.168.1.5',
    lastSeenAt: new Date(Date.now() - 7200000), // 2 hours ago
    zoneId: 'zone-bangalore-west',
    metadata: { rating: 4.5, totalDeliveries: 120 },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Emily Davis',
    phone: '+1234567895',
    vehicleType: 'bike',
    capacity: 4,
    online: true,
    latitude: 12.9698,
    longitude: 77.7500,
    ipAddress: '192.168.1.6',
    lastSeenAt: new Date(),
    zoneId: 'zone-bangalore-central',
    metadata: { rating: 4.9, totalDeliveries: 210 },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Robert Martinez',
    phone: '+1234567896',
    vehicleType: 'car',
    capacity: 6,
    online: true,
    latitude: 12.8350,
    longitude: 77.6861,
    ipAddress: '192.168.1.7',
    lastSeenAt: new Date(),
    zoneId: 'zone-bangalore-south',
    metadata: { rating: 4.8, totalDeliveries: 175 },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'Lisa Anderson',
    phone: '+1234567897',
    vehicleType: 'scooter',
    capacity: 2,
    online: false,
    latitude: 13.0210,
    longitude: 77.6387,
    ipAddress: '192.168.1.8',
    lastSeenAt: new Date(Date.now() - 1800000), // 30 min ago
    zoneId: 'zone-bangalore-north',
    metadata: { rating: 4.7, totalDeliveries: 140 },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    name: 'Chris Taylor',
    phone: '+1234567898',
    vehicleType: 'bike',
    capacity: 3,
    online: true,
    latitude: 12.9279,
    longitude: 77.6271,
    ipAddress: '192.168.1.9',
    lastSeenAt: new Date(),
    zoneId: 'zone-bangalore-east',
    metadata: { rating: 4.6, totalDeliveries: 88 },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: 'Amanda White',
    phone: '+1234567899',
    vehicleType: 'scooter',
    capacity: 2,
    online: false,
    latitude: 12.8628,
    longitude: 77.5200,
    ipAddress: '192.168.1.10',
    lastSeenAt: new Date(Date.now() - 10800000), // 3 hours ago
    zoneId: 'zone-bangalore-west',
    metadata: { rating: 4.8, totalDeliveries: 160 },
  },
];

const demoOrders = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    externalRef: 'ZOMATO-2025-001',
    pickup: {
      lat: 12.9716,
      lng: 77.5946,
      address: 'The Pizza Place, MG Road, Bangalore',
      phone: '+919876543210',
    },
    dropoff: {
      lat: 12.9352,
      lng: 77.6245,
      address: 'Flat 501, Prestige Towers, Indiranagar, Bangalore',
      phone: '+919876543211',
      customerName: 'Rajesh Kumar',
    },
    status: 'assigned',
    paymentType: 'online',
    items: [
      { name: 'Margherita Pizza (Large)', quantity: 1, price: 450 },
      { name: 'Garlic Bread', quantity: 2, price: 150 },
      { name: 'Coke (500ml)', quantity: 1, price: 40 },
    ],
    slaSeconds: 1800, // 30 minutes
    trackingUrl: 'http://localhost:3001/track/660e8400-e29b-41d4-a716-446655440001',
    assignedAt: new Date(Date.now() - 600000), // 10 min ago
    driverId: '550e8400-e29b-41d4-a716-446655440001',
    zoneId: 'zone-bangalore-central',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    externalRef: 'SWIGGY-2025-002',
    pickup: {
      lat: 13.0358,
      lng: 77.5970,
      address: 'Burger King, Hebbal, Bangalore',
      phone: '+919876543212',
    },
    dropoff: {
      lat: 13.0210,
      lng: 77.6387,
      address: 'Manyata Tech Park, Building 12, Bangalore',
      phone: '+919876543213',
      customerName: 'Priya Sharma',
    },
    status: 'picked_up',
    paymentType: 'cod',
    items: [
      { name: 'Whopper Meal', quantity: 2, price: 680 },
      { name: 'Chicken Nuggets', quantity: 1, price: 180 },
    ],
    slaSeconds: 1800,
    trackingUrl: 'http://localhost:3001/track/660e8400-e29b-41d4-a716-446655440002',
    assignedAt: new Date(Date.now() - 900000), // 15 min ago
    driverId: '550e8400-e29b-41d4-a716-446655440004',
    zoneId: 'zone-bangalore-north',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    externalRef: 'ZOMATO-2025-003',
    pickup: {
      lat: 12.9141,
      lng: 77.6411,
      address: 'Chinese Wok, Koramangala, Bangalore',
      phone: '+919876543214',
    },
    dropoff: {
      lat: 12.8456,
      lng: 77.6630,
      address: 'HSR Layout, Sector 1, Bangalore',
      phone: '+919876543215',
      customerName: 'Amit Patel',
    },
    status: 'out_for_delivery',
    paymentType: 'online',
    items: [
      { name: 'Veg Noodles', quantity: 1, price: 220 },
      { name: 'Manchurian Dry', quantity: 1, price: 240 },
      { name: 'Spring Rolls', quantity: 1, price: 180 },
    ],
    slaSeconds: 1800,
    trackingUrl: 'http://localhost:3001/track/660e8400-e29b-41d4-a716-446655440003',
    assignedAt: new Date(Date.now() - 1200000), // 20 min ago
    driverId: '550e8400-e29b-41d4-a716-446655440007',
    zoneId: 'zone-bangalore-south',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440004',
    externalRef: 'SWIGGY-2025-004',
    pickup: {
      lat: 12.9698,
      lng: 77.7500,
      address: 'Biryani House, Whitefield, Bangalore',
      phone: '+919876543216',
    },
    dropoff: {
      lat: 12.9769,
      lng: 77.7340,
      address: 'Phoenix Marketcity, Whitefield, Bangalore',
      phone: '+919876543217',
      customerName: 'Sneha Reddy',
    },
    status: 'delivered',
    paymentType: 'online',
    items: [
      { name: 'Chicken Biryani', quantity: 2, price: 560 },
      { name: 'Raita', quantity: 2, price: 80 },
    ],
    slaSeconds: 1800,
    trackingUrl: 'http://localhost:3001/track/660e8400-e29b-41d4-a716-446655440004',
    assignedAt: new Date(Date.now() - 2700000), // 45 min ago
    driverId: '550e8400-e29b-41d4-a716-446655440006',
    zoneId: 'zone-bangalore-east',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440005',
    externalRef: 'ZOMATO-2025-005',
    pickup: {
      lat: 12.9279,
      lng: 77.6271,
      address: 'Cafe Coffee Day, Indiranagar, Bangalore',
      phone: '+919876543218',
    },
    dropoff: {
      lat: 12.9698,
      lng: 77.5946,
      address: 'Cubbon Park Metro, Bangalore',
      phone: '+919876543219',
      customerName: 'Vikram Singh',
    },
    status: 'pending',
    paymentType: 'cod',
    items: [
      { name: 'Cappuccino', quantity: 2, price: 240 },
      { name: 'Chocolate Cake', quantity: 1, price: 180 },
    ],
    slaSeconds: 1800,
    trackingUrl: null,
    assignedAt: null,
    driverId: null,
    zoneId: 'zone-bangalore-central',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440006',
    externalRef: 'SWIGGY-2025-006',
    pickup: {
      lat: 12.8628,
      lng: 77.5200,
      address: 'Dominos Pizza, Jayanagar, Bangalore',
      phone: '+919876543220',
    },
    dropoff: {
      lat: 12.9141,
      lng: 77.6411,
      address: 'Koramangala 4th Block, Bangalore',
      phone: '+919876543221',
      customerName: 'Ananya Iyer',
    },
    status: 'pending',
    paymentType: 'online',
    items: [
      { name: 'Farmhouse Pizza (Medium)', quantity: 1, price: 399 },
      { name: 'Garlic Breadsticks', quantity: 1, price: 120 },
    ],
    slaSeconds: 1800,
    trackingUrl: null,
    assignedAt: null,
    driverId: null,
    zoneId: 'zone-bangalore-south',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440007',
    externalRef: 'ZOMATO-2025-007',
    pickup: {
      lat: 12.9716,
      lng: 77.5946,
      address: 'Subway, MG Road, Bangalore',
      phone: '+919876543222',
    },
    dropoff: {
      lat: 12.9698,
      lng: 77.6387,
      address: 'Trinity Metro, Bangalore',
      phone: '+919876543223',
      customerName: 'Ravi Krishnan',
    },
    status: 'cancelled',
    paymentType: 'online',
    items: [
      { name: 'Veggie Delite Sub (6inch)', quantity: 2, price: 260 },
    ],
    slaSeconds: 1800,
    trackingUrl: 'http://localhost:3001/track/660e8400-e29b-41d4-a716-446655440007',
    assignedAt: new Date(Date.now() - 3600000), // 1 hour ago
    driverId: '550e8400-e29b-41d4-a716-446655440002',
    zoneId: 'zone-bangalore-central',
  },
];

export async function seedDatabase(dataSource: DataSource) {
  console.log('🌱 Starting database seeding...');

  const driverRepo = dataSource.getRepository(DriverEntity);
  const orderRepo = dataSource.getRepository(OrderEntity);
  const routePlanRepo = dataSource.getRepository(RoutePlanEntity);
  const trackingRepo = dataSource.getRepository(TrackingPointEntity);

  try {
    // Clear existing data (for development only!)
    console.log('🧹 Cleaning existing data...');
    await trackingRepo.delete({});
    await routePlanRepo.delete({});
    await orderRepo.delete({});
    await driverRepo.delete({});

    // Seed drivers
    console.log('👤 Seeding drivers...');
    for (const driverData of demoDrivers) {
      const driver = driverRepo.create(driverData);
      await driverRepo.save(driver);
    }
    console.log(`✅ Created ${demoDrivers.length} drivers`);

    // Seed orders
    console.log('📦 Seeding orders...');
    for (const orderData of demoOrders) {
      const order = orderRepo.create(orderData);
      await orderRepo.save(order);
    }
    console.log(`✅ Created ${demoOrders.length} orders`);

    // Seed route plans for assigned orders
    console.log('🗺️  Seeding route plans...');
    const routePlans = [
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        driverId: '550e8400-e29b-41d4-a716-446655440001',
        orderId: '660e8400-e29b-41d4-a716-446655440001',
        stops: [
          {
            lat: 12.9716,
            lng: 77.5946,
            orderId: '660e8400-e29b-41d4-a716-446655440001',
            eta: '300', // 5 min
          },
          {
            lat: 12.9352,
            lng: 77.6245,
            orderId: '660e8400-e29b-41d4-a716-446655440001',
            eta: '900', // 15 min from start
          },
        ],
        totalDistanceKm: 8.4,
        etaPerStop: ['300', '900'],
        provider: 'optimoroute',
        rawResponse: { optimized: true, algorithm: 'dijkstra' },
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440002',
        driverId: '550e8400-e29b-41d4-a716-446655440004',
        orderId: '660e8400-e29b-41d4-a716-446655440002',
        stops: [
          {
            lat: 13.0358,
            lng: 77.5970,
            orderId: '660e8400-e29b-41d4-a716-446655440002',
            eta: '180',
          },
          {
            lat: 13.0210,
            lng: 77.6387,
            orderId: '660e8400-e29b-41d4-a716-446655440002',
            eta: '720',
          },
        ],
        totalDistanceKm: 6.2,
        etaPerStop: ['180', '720'],
        provider: 'optimoroute',
        rawResponse: { optimized: true },
      },
    ];

    for (const planData of routePlans) {
      const plan = routePlanRepo.create(planData);
      await routePlanRepo.save(plan);
    }
    console.log(`✅ Created ${routePlans.length} route plans`);

    // Seed tracking points for active orders
    console.log('📍 Seeding tracking points...');
    const trackingPoints = [];

    // Create tracking history for order 1 (assigned)
    const startTime = Date.now() - 600000; // 10 min ago
    for (let i = 0; i < 10; i++) {
      trackingPoints.push({
        orderId: '660e8400-e29b-41d4-a716-446655440001',
        driverId: '550e8400-e29b-41d4-a716-446655440001',
        latitude: 12.9716 + (12.9352 - 12.9716) * (i / 10),
        longitude: 77.5946 + (77.6245 - 77.5946) * (i / 10),
        speed: 25 + Math.random() * 10,
        heading: 45,
        recordedAt: new Date(startTime + i * 60000),
        metadata: { accuracy: 10 },
      });
    }

    // Create tracking history for order 2 (picked_up)
    const startTime2 = Date.now() - 900000; // 15 min ago
    for (let i = 0; i < 15; i++) {
      trackingPoints.push({
        orderId: '660e8400-e29b-41d4-a716-446655440002',
        driverId: '550e8400-e29b-41d4-a716-446655440004',
        latitude: 13.0358 + (13.0210 - 13.0358) * (i / 15),
        longitude: 77.5970 + (77.6387 - 77.5970) * (i / 15),
        speed: 30 + Math.random() * 10,
        heading: 90,
        recordedAt: new Date(startTime2 + i * 60000),
        metadata: { accuracy: 8 },
      });
    }

    for (const pointData of trackingPoints) {
      const point = trackingRepo.create(pointData);
      await trackingRepo.save(point);
    }
    console.log(`✅ Created ${trackingPoints.length} tracking points`);

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Drivers: ${demoDrivers.length} (${demoDrivers.filter(d => d.online).length} online)`);
    console.log(`   - Orders: ${demoOrders.length} (${demoOrders.filter(o => o.status === 'pending').length} available for assignment)`);
    console.log(`   - Route Plans: ${routePlans.length}`);
    console.log(`   - Tracking Points: ${trackingPoints.length}`);
    console.log('');
    console.log('🔐 Demo Credentials:');
    console.log('   Driver 1: +1234567890 (OTP: 123456) - John Doe - Online, 3 capacity');
    console.log('   Driver 2: +1234567891 (OTP: 123456) - Jane Smith - Online, 2 capacity');
    console.log('   Admin: admin@stackdelivery.com / Admin@123');
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Standalone execution
if (require.main === module) {
  (async () => {
    const { DataSource } = require('typeorm');

    const AppDataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery',
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: false,
    });

    await AppDataSource.initialize();
    await seedDatabase(AppDataSource);
    await AppDataSource.destroy();
    process.exit(0);
  })();
}
