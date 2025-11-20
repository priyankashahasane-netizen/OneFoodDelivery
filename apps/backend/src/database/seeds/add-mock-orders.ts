import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { OrderEntity } from '../../modules/orders/entities/order.entity.js';
import { DriverEntity } from '../../modules/drivers/entities/driver.entity.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * TypeORM DataSource configuration
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: true,
});

/**
 * Add mock orders to the database
 */
async function addMockOrders() {
  console.log('🚀 Initializing database connection...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const driverRepo = AppDataSource.getRepository(DriverEntity);

    // Find the demo account driver (phone: 9975008124 or +919975008124)
    const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
    let demoDriver = null;
    
    for (const phone of demoPhones) {
      demoDriver = await driverRepo.findOne({ where: { phone } });
      if (demoDriver) {
        console.log(`📱 Found demo account driver with phone: ${phone}`);
        break;
      }
    }

    // If demo driver not found, get first available driver
    if (!demoDriver) {
      const drivers = await driverRepo.find({ take: 1 });
      if (drivers.length > 0) {
        demoDriver = drivers[0];
        console.log(`⚠️  Demo account not found, using first available driver: ${demoDriver.phone}`);
      } else {
        console.log(`⚠️  No drivers found. Orders will be created without driver assignment.`);
      }
    }

    console.log(`📦 Adding mock orders...`);
    console.log(`👤 Demo Driver: ${demoDriver ? `${demoDriver.name} (${demoDriver.phone})` : 'Not found'}`);

    const mockOrders = [
      // Pending orders
      {
        externalRef: 'ZOMATO-MOCK-001',
        pickup: {
          lat: 12.9352,
          lng: 77.6245,
          address: 'Dominos Pizza, Koramangala, Bengaluru',
        },
        dropoff: {
          lat: 12.9141,
          lng: 77.6411,
          address: 'HSR Layout Sector 2, Bengaluru',
        },
        status: 'pending',
        paymentType: 'online',
        items: [
          { name: 'Farmhouse Pizza', quantity: 1, price: 399 },
          { name: 'Garlic Breadsticks', quantity: 1, price: 149 },
          { name: 'Pepsi 500ml', quantity: 2, price: 80 },
        ],
        slaSeconds: 2700, // 45 minutes
        trackingUrl: null,
        driverId: null,
        assignedAt: null,
        zoneId: null,
      },
      {
        externalRef: 'SWIGGY-MOCK-002',
        pickup: {
          lat: 12.9716,
          lng: 77.5946,
          address: 'McDonald\'s, MG Road, Bengaluru',
        },
        dropoff: {
          lat: 12.9558,
          lng: 77.6077,
          address: 'Whitefield Main Road, Bengaluru',
        },
        status: 'pending',
        paymentType: 'cash',
        items: [
          { name: 'McAloo Tikki Burger', quantity: 2, price: 120 },
          { name: 'Medium Fries', quantity: 1, price: 85 },
          { name: 'Coca Cola', quantity: 2, price: 60 },
        ],
        slaSeconds: 1800, // 30 minutes
        trackingUrl: null,
        driverId: null,
        assignedAt: null,
        zoneId: null,
      },
      // Assigned orders
      {
        externalRef: 'UBER-MOCK-003',
        pickup: {
          lat: 12.9667,
          lng: 77.5667,
          address: 'KFC, Rajaji Nagar, Bengaluru',
        },
        dropoff: {
          lat: 12.9822,
          lng: 77.5946,
          address: 'Hebbal, Bengaluru',
        },
        status: 'assigned',
        paymentType: 'online',
        items: [
          { name: 'Hot & Crispy Chicken (6 pcs)', quantity: 1, price: 549 },
          { name: 'Coleslaw', quantity: 1, price: 89 },
        ],
        slaSeconds: 2400, // 40 minutes
        trackingUrl: `http://localhost:3001/track/UBER-MOCK-003`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(),
        zoneId: null,
      },
      {
        externalRef: 'DUNZO-MOCK-004',
        pickup: {
          lat: 12.9279,
          lng: 77.6271,
          address: 'Subway, Indiranagar, Bengaluru',
        },
        dropoff: {
          lat: 12.9698,
          lng: 77.6469,
          address: 'Malleshwaram, Bengaluru',
        },
        status: 'assigned',
        paymentType: 'cash',
        items: [
          { name: 'Chicken Teriyaki Sub', quantity: 1, price: 299 },
          { name: 'Chocolate Chip Cookie', quantity: 2, price: 90 },
        ],
        slaSeconds: 2100, // 35 minutes
        trackingUrl: `http://localhost:3001/track/DUNZO-MOCK-004`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 300000), // 5 mins ago
        zoneId: null,
      },
      // Picked up orders
      {
        externalRef: 'ZOMATO-MOCK-005',
        pickup: {
          lat: 12.9141,
          lng: 77.6411,
          address: 'Burger King, HSR Layout, Bengaluru',
        },
        dropoff: {
          lat: 12.9352,
          lng: 77.6245,
          address: 'Koramangala 5th Block, Bengaluru',
        },
        status: 'picked_up',
        paymentType: 'online',
        items: [
          { name: 'Whopper Meal', quantity: 1, price: 299 },
          { name: 'Onion Rings', quantity: 1, price: 149 },
        ],
        slaSeconds: 1500, // 25 minutes
        trackingUrl: `http://localhost:3001/track/ZOMATO-MOCK-005`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 900000), // 15 mins ago
        zoneId: null,
      },
      // Out for delivery
      {
        externalRef: 'SWIGGY-MOCK-006',
        pickup: {
          lat: 12.9558,
          lng: 77.6077,
          address: 'Starbucks, Whitefield, Bengaluru',
        },
        dropoff: {
          lat: 12.9716,
          lng: 77.5946,
          address: 'MG Road, Bengaluru',
        },
        status: 'out_for_delivery',
        paymentType: 'online',
        items: [
          { name: 'Cappuccino Grande', quantity: 2, price: 320 },
          { name: 'Blueberry Muffin', quantity: 1, price: 150 },
          { name: 'Chocolate Croissant', quantity: 1, price: 180 },
        ],
        slaSeconds: 1200, // 20 minutes
        trackingUrl: `http://localhost:3001/track/SWIGGY-MOCK-006`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 1800000), // 30 mins ago
        zoneId: null,
      },
      // Delivered orders
      {
        externalRef: 'UBER-MOCK-007',
        pickup: {
          lat: 12.9822,
          lng: 77.5946,
          address: 'Biryani House, Yeshwanthpur, Bengaluru',
        },
        dropoff: {
          lat: 12.9667,
          lng: 77.5667,
          address: 'Rajaji Nagar, Bengaluru',
        },
        status: 'delivered',
        paymentType: 'cash',
        items: [
          { name: 'Chicken Biryani', quantity: 1, price: 250 },
          { name: 'Raita', quantity: 1, price: 40 },
          { name: 'Pickle', quantity: 1, price: 20 },
        ],
        slaSeconds: 2100, // 35 minutes
        trackingUrl: `http://localhost:3001/track/UBER-MOCK-007`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 7200000), // 2 hours ago
        zoneId: null,
      },
      {
        externalRef: 'ZOMATO-MOCK-008',
        pickup: {
          lat: 12.9352,
          lng: 77.6245,
          address: 'Pizza Express, Koramangala, Bengaluru',
        },
        dropoff: {
          lat: 12.9141,
          lng: 77.6411,
          address: 'HSR Layout Sector 7, Bengaluru',
        },
        status: 'delivered',
        paymentType: 'online',
        items: [
          { name: 'Margherita Pizza', quantity: 1, price: 299 },
          { name: 'Caesar Salad', quantity: 1, price: 199 },
        ],
        slaSeconds: 1800, // 30 minutes
        trackingUrl: `http://localhost:3001/track/ZOMATO-MOCK-008`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 86400000), // 1 day ago
        zoneId: null,
      },
      {
        externalRef: 'SWIGGY-MOCK-009',
        pickup: {
          lat: 12.9716,
          lng: 77.5946,
          address: 'Domino\'s, MG Road, Bengaluru',
        },
        dropoff: {
          lat: 12.9558,
          lng: 77.6077,
          address: 'Whitefield Tech Park, Bengaluru',
        },
        status: 'delivered',
        paymentType: 'online',
        items: [
          { name: 'Pepperoni Pizza', quantity: 1, price: 449 },
          { name: 'Garlic Bread', quantity: 1, price: 149 },
        ],
        slaSeconds: 2400, // 40 minutes
        trackingUrl: `http://localhost:3001/track/SWIGGY-MOCK-009`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 172800000), // 2 days ago
        zoneId: null,
      },

      // cancelled orders
      {
        externalRef: 'UBER-MOCK-010',
        pickup: {
          lat: 12.9667,
          lng: 77.5667,
          address: 'Taco Bell, Rajaji Nagar, Bengaluru',
        },
        dropoff: {
          lat: 12.9822,
          lng: 77.5946,
          address: 'Hebbal Main Road, Bengaluru',
        },
        status: 'cancelled',
        paymentType: 'online',
        items: [
          { name: 'Crunchwrap Supreme', quantity: 2, price: 340 },
        ],
        slaSeconds: 1800, // 30 minutes
        trackingUrl: null,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 10800000), // 3 hours ago
        zoneId: null,
      },
      {
        externalRef: 'DUNZO-MOCK-011',
        pickup: {
          lat: 12.9279,
          lng: 77.6271,
          address: 'Burger King, Indiranagar, Bengaluru',
        },
        dropoff: {
          lat: 12.9698,
          lng: 77.6469,
          address: 'Malleshwaram Metro Station, Bengaluru',
        },
        status: 'cancelled',
        paymentType: 'cash',
        items: [
          { name: 'Whopper Burger', quantity: 1, price: 199 },
          { name: 'Medium Fries', quantity: 1, price: 85 },
        ],
        slaSeconds: 1500, // 25 minutes
        trackingUrl: null,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 3600000), // 1 hour ago
        zoneId: null,
      },

      // Refund requested orders
      {
        externalRef: 'ZOMATO-MOCK-012',
        pickup: {
          lat: 12.9141,
          lng: 77.6411,
          address: 'Subway, HSR Layout, Bengaluru',
        },
        dropoff: {
          lat: 12.9352,
          lng: 77.6245,
          address: 'Koramangala 3rd Block, Bengaluru',
        },
        status: 'refund_requested',
        paymentType: 'online',
        items: [
          { name: 'Veggie Delite Sub', quantity: 1, price: 199 },
          { name: 'Cookie Pack', quantity: 1, price: 90 },
        ],
        slaSeconds: 1800, // 30 minutes
        trackingUrl: `http://localhost:3001/track/ZOMATO-MOCK-012`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 14400000), // 4 hours ago
        zoneId: null,
      },
      {
        externalRef: 'SWIGGY-MOCK-013',
        pickup: {
          lat: 12.9558,
          lng: 77.6077,
          address: 'KFC, Whitefield, Bengaluru',
        },
        dropoff: {
          lat: 12.9716,
          lng: 77.5946,
          address: 'MG Road Circle, Bengaluru',
        },
        status: 'refund_requested',
        paymentType: 'online',
        items: [
          { name: 'Chicken Bucket (8 pcs)', quantity: 1, price: 649 },
          { name: 'Coleslaw', quantity: 1, price: 89 },
        ],
        slaSeconds: 2100, // 35 minutes
        trackingUrl: `http://localhost:3001/track/SWIGGY-MOCK-013`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 18000000), // 5 hours ago
        zoneId: null,
      },

      // Refunded orders
      {
        externalRef: 'UBER-MOCK-014',
        pickup: {
          lat: 12.9822,
          lng: 77.5946,
          address: 'McDonald\'s, Yeshwanthpur, Bengaluru',
        },
        dropoff: {
          lat: 12.9667,
          lng: 77.5667,
          address: 'Rajaji Nagar Cross, Bengaluru',
        },
        status: 'refunded',
        paymentType: 'online',
        items: [
          { name: 'Big Mac Meal', quantity: 1, price: 299 },
          { name: 'Apple Pie', quantity: 2, price: 100 },
        ],
        slaSeconds: 1800, // 30 minutes
        trackingUrl: `http://localhost:3001/track/UBER-MOCK-014`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 259200000), // 3 days ago
        zoneId: null,
      },
      {
        externalRef: 'DUNZO-MOCK-015',
        pickup: {
          lat: 12.9698,
          lng: 77.6469,
          address: 'Starbucks, Malleshwaram, Bengaluru',
        },
        dropoff: {
          lat: 12.9279,
          lng: 77.6271,
          address: 'Indiranagar 100 Feet Road, Bengaluru',
        },
        status: 'refunded',
        paymentType: 'online',
        items: [
          { name: 'Cappuccino Grande', quantity: 2, price: 320 },
          { name: 'Blueberry Muffin', quantity: 1, price: 150 },
        ],
        slaSeconds: 1500, // 25 minutes
        trackingUrl: `http://localhost:3001/track/DUNZO-MOCK-015`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 345600000), // 4 days ago
        zoneId: null,
      },

      // Refund request cancelled orders
      {
        externalRef: 'ZOMATO-MOCK-016',
        pickup: {
          lat: 12.9352,
          lng: 77.6245,
          address: 'Pizza Hut, Koramangala, Bengaluru',
        },
        dropoff: {
          lat: 12.9141,
          lng: 77.6411,
          address: 'HSR Layout Sector 1, Bengaluru',
        },
        status: 'refund_request_cancelled',
        paymentType: 'online',
        items: [
          { name: 'Farmhouse Pizza', quantity: 1, price: 399 },
          { name: 'Garlic Bread', quantity: 1, price: 149 },
        ],
        slaSeconds: 2700, // 45 minutes
        trackingUrl: `http://localhost:3001/track/ZOMATO-MOCK-016`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 21600000), // 6 hours ago
        zoneId: null,
      },
      {
        externalRef: 'SWIGGY-MOCK-017',
        pickup: {
          lat: 12.9716,
          lng: 77.5946,
          address: 'Burger King, MG Road, Bengaluru',
        },
        dropoff: {
          lat: 12.9558,
          lng: 77.6077,
          address: 'Whitefield Main Road, Bengaluru',
        },
        status: 'refund_request_cancelled',
        paymentType: 'cash',
        items: [
          { name: 'Whopper Meal', quantity: 1, price: 299 },
          { name: 'Onion Rings', quantity: 1, price: 149 },
        ],
        slaSeconds: 1800, // 30 minutes
        trackingUrl: `http://localhost:3001/track/SWIGGY-MOCK-017`,
        driverId: demoDriver?.id || null,
        assignedAt: new Date(Date.now() - 25200000), // 7 hours ago
        zoneId: null,
      },
    ];

    const savedOrders = await orderRepo.save(mockOrders);

    console.log(`✅ Successfully added ${savedOrders.length} mock orders`);
    console.log('\n📋 Order Summary:');
    savedOrders.forEach((order) => {
      console.log(`  - ${order.externalRef}: ${order.status} (${order.paymentType})`);
    });

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding mock orders:', error);
    process.exit(1);
  }
}

addMockOrders();

