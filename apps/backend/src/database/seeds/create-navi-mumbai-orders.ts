import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { OrderEntity } from '../../modules/orders/entities/order.entity.js';
import { DriverEntity } from '../../modules/drivers/entities/driver.entity.js';

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
  logging: false,
});

/**
 * Navi Mumbai locations (Vashi, Nerul, and nearby areas)
 */
const naviMumbaiLocations = {
  vashi: {
    pickup: [
      { lat: 19.0756, lng: 72.9982, address: 'Vashi Railway Station, Sector 17, Vashi' },
      { lat: 19.0800, lng: 73.0000, address: 'Inorbit Mall, Vashi' },
      { lat: 19.0700, lng: 72.9950, address: 'Apna Bazar, Sector 9, Vashi' },
      { lat: 19.0780, lng: 73.0020, address: 'KFC, Sector 17, Vashi' },
      { lat: 19.0720, lng: 72.9970, address: 'McDonald\'s, Sector 17, Vashi' },
      { lat: 19.0760, lng: 73.0010, address: 'Domino\'s Pizza, Vashi' },
      { lat: 19.0740, lng: 72.9990, address: 'Pizza Hut, Vashi' },
      { lat: 19.0790, lng: 73.0030, address: 'Subway, Vashi' },
    ],
    dropoff: [
      { lat: 19.0820, lng: 73.0050, address: 'Sector 20, Vashi' },
      { lat: 19.0680, lng: 72.9920, address: 'Sector 10, Vashi' },
      { lat: 19.0840, lng: 73.0070, address: 'Sector 28, Vashi' },
      { lat: 19.0660, lng: 72.9900, address: 'Sector 8, Vashi' },
      { lat: 19.0860, lng: 73.0090, address: 'Sector 30, Vashi' },
      { lat: 19.0640, lng: 72.9880, address: 'Sector 6, Vashi' },
      { lat: 19.0880, lng: 73.0110, address: 'Sector 32, Vashi' },
      { lat: 19.0620, lng: 72.9860, address: 'Sector 4, Vashi' },
    ],
  },
  nerul: {
    pickup: [
      { lat: 19.0330, lng: 73.0197, address: 'Nerul Railway Station, Sector 20, Nerul' },
      { lat: 19.0380, lng: 73.0220, address: 'D-Mart, Nerul' },
      { lat: 19.0300, lng: 73.0170, address: 'Reliance Fresh, Nerul' },
      { lat: 19.0400, lng: 73.0240, address: 'Burger King, Nerul' },
      { lat: 19.0280, lng: 73.0150, address: 'Cafe Coffee Day, Nerul' },
      { lat: 19.0420, lng: 73.0260, address: 'Starbucks, Nerul' },
      { lat: 19.0260, lng: 73.0130, address: 'Barbeque Nation, Nerul' },
      { lat: 19.0440, lng: 73.0280, address: 'Haldiram\'s, Nerul' },
    ],
    dropoff: [
      { lat: 19.0460, lng: 73.0300, address: 'Sector 25, Nerul' },
      { lat: 19.0240, lng: 73.0110, address: 'Sector 15, Nerul' },
      { lat: 19.0480, lng: 73.0320, address: 'Sector 27, Nerul' },
      { lat: 19.0220, lng: 73.0090, address: 'Sector 12, Nerul' },
      { lat: 19.0500, lng: 73.0340, address: 'Sector 29, Nerul' },
      { lat: 19.0200, lng: 73.0070, address: 'Sector 10, Nerul' },
      { lat: 19.0520, lng: 73.0360, address: 'Sector 31, Nerul' },
      { lat: 19.0180, lng: 73.0050, address: 'Sector 8, Nerul' },
    ],
  },
  nearby: {
    pickup: [
      { lat: 19.0900, lng: 73.0100, address: 'Sanpada Railway Station, Sanpada' },
      { lat: 19.1000, lng: 73.0200, address: 'Seawoods Grand Central, Seawoods' },
      { lat: 19.0550, lng: 73.0400, address: 'Kharghar Station, Kharghar' },
      { lat: 19.1100, lng: 73.0300, address: 'Belapur CBD, Belapur' },
      { lat: 19.0450, lng: 73.0500, address: 'Panvel Station, Panvel' },
      { lat: 19.0850, lng: 73.0150, address: 'Turbhe Station, Turbhe' },
      { lat: 19.0950, lng: 73.0250, address: 'Juinagar Station, Juinagar' },
      { lat: 19.1050, lng: 73.0350, address: 'CBD Belapur Station, Belapur' },
    ],
    dropoff: [
      { lat: 19.0920, lng: 73.0120, address: 'Sector 5, Sanpada' },
      { lat: 19.1020, lng: 73.0220, address: 'Sector 40, Seawoods' },
      { lat: 19.0570, lng: 73.0420, address: 'Sector 35, Kharghar' },
      { lat: 19.1120, lng: 73.0320, address: 'Sector 11, Belapur' },
      { lat: 19.0470, lng: 73.0520, address: 'Sector 10, Panvel' },
      { lat: 19.0870, lng: 73.0170, address: 'Sector 19, Turbhe' },
      { lat: 19.0970, lng: 73.0270, address: 'Sector 8, Juinagar' },
      { lat: 19.1070, lng: 73.0370, address: 'Sector 15, Belapur' },
    ],
  },
};

/**
 * Order statuses with distribution
 */
const orderStatuses = [
  'pending', 'pending', 'pending', 'pending', 'pending', // 5 pending
  'assigned', 'assigned', 'assigned', 'assigned', 'assigned', // 5 assigned
  'picked_up', 'picked_up', 'picked_up', 'picked_up', 'picked_up', // 5 picked_up
  'picked_up', 'picked_up', 'picked_up', 'picked_up', 'picked_up', // 5 more picked_up
  'delivered', 'delivered', 'delivered', 'delivered', 'delivered', // 5 delivered
  'delivered', 'delivered', 'delivered', 'delivered', 'delivered', // 5 more delivered
  'delivered', 'delivered', 'delivered', 'delivered', 'delivered', // 5 more delivered
  'delivered', 'delivered', 'delivered', 'delivered', 'delivered', // 5 more delivered
  'delivered', 'delivered', 'delivered', 'delivered', 'delivered', // 5 more delivered
  'cancelled', 'cancelled', 'cancelled', 'cancelled', 'cancelled', // 5 cancelled
  'cancelled', 'cancelled', 'cancelled', 'cancelled', 'cancelled', // 5 more cancelled
  'refund_requested', 'refund_requested', // 2 refund_requested
  'refund_processing', 'refund_processing', // 2 refund_processing
  'refund_completed', 'refund_completed', // 2 refund_completed
];

/**
 * Payment types
 */
const paymentTypes = ['cod', 'prepaid', 'cod', 'prepaid', 'cod', 'prepaid', 'cod', 'prepaid'];

/**
 * Sample items
 */
const sampleItems = [
  [{ name: 'Margherita Pizza', quantity: 1, price: 299 }],
  [{ name: 'Pepperoni Pizza', quantity: 1, price: 399 }],
  [{ name: 'Big Mac Combo', quantity: 2, price: 780 }],
  [{ name: 'Chicken Burger', quantity: 2, price: 240 }],
  [{ name: 'Chicken Biryani', quantity: 1, price: 250 }],
  [{ name: 'Veg Thali', quantity: 1, price: 180 }],
  [{ name: 'Paneer Tikka', quantity: 1, price: 220 }],
  [{ name: 'Butter Chicken', quantity: 1, price: 350 }],
  [{ name: 'Fried Rice', quantity: 1, price: 150 }],
  [{ name: 'Noodles', quantity: 1, price: 140 }],
  [{ name: 'Dosa', quantity: 2, price: 120 }],
  [{ name: 'Idli Sambar', quantity: 2, price: 80 }],
  [{ name: 'Pav Bhaji', quantity: 1, price: 100 }],
  [{ name: 'Vada Pav', quantity: 2, price: 40 }],
  [{ name: 'Samosa', quantity: 4, price: 60 }],
];

/**
 * Generate random number between min and max
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random element from array
 */
function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

/**
 * Create 70 orders in Navi Mumbai area
 */
async function createNaviMumbaiOrders() {
  console.log('🚀 Creating 70 orders in Navi Mumbai (Vashi, Nerul, and nearby areas)...\n');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const driverRepo = AppDataSource.getRepository(DriverEntity);

    // Get demo driver (optional - some orders can be unassigned)
    const demoDriver = await driverRepo.findOne({ where: { phone: '+919975008124' } });
    const driverId = demoDriver?.id || null;

    console.log(`👤 Using driver: ${demoDriver ? `${demoDriver.name} (${demoDriver.phone})` : 'None (unassigned orders)'}\n`);

    // Collect all locations
    const allPickupLocations = [
      ...naviMumbaiLocations.vashi.pickup,
      ...naviMumbaiLocations.nerul.pickup,
      ...naviMumbaiLocations.nearby.pickup,
    ];
    const allDropoffLocations = [
      ...naviMumbaiLocations.vashi.dropoff,
      ...naviMumbaiLocations.nerul.dropoff,
      ...naviMumbaiLocations.nearby.dropoff,
    ];

    const orders: any[] = [];
    const now = new Date();

    for (let i = 1; i <= 70; i++) {
      const status = orderStatuses[i - 1] || 'pending'; // Fallback to pending if somehow undefined
      const pickup = randomElement(allPickupLocations);
      const dropoff = randomElement(allDropoffLocations);
      const paymentType = randomElement(paymentTypes);
      const items = randomElement(sampleItems);
      const externalRef = `NM-${String(i).padStart(4, '0')}`;

      // Calculate SLA (30-60 minutes)
      const slaSeconds = randomInt(1800, 3600);

      // Determine if order should be assigned to driver
      const shouldAssign = ['assigned', 'picked_up', 'delivered'].includes(status) && driverId;
      const assignedDriverId = shouldAssign ? driverId : null;
      const assignedAt = shouldAssign ? new Date(now.getTime() - randomInt(0, 3600000)) : null;

      // For delivered orders, set deliveredAt
      let deliveredAt: Date | null = null;
      if (status === 'delivered' && assignedAt) {
        deliveredAt = new Date(assignedAt.getTime() + randomInt(600000, 1800000)); // 10-30 minutes after assignment
      }

      // For cancelled orders, add cancellation details
      let cancellationSource: string | null = null;
      let cancellationReason: string | null = null;
      if (status === 'cancelled') {
        cancellationSource = randomElement(['customer', 'driver', 'system']);
        cancellationReason = randomElement([
          'Customer requested cancellation',
          'Driver unavailable',
          'Restaurant closed',
          'Address not found',
          'Payment issue',
          'Order timeout',
        ]);
      }

      // Tracking URL for assigned/picked_up/delivered orders
      const trackingUrl = assignedDriverId
        ? `https://track.example.com/orders/${externalRef}`
        : null;

      // Ensure status is never null or undefined
      if (!status) {
        console.warn(`Warning: Order ${i} has no status, defaulting to 'pending'`);
      }

      orders.push({
        externalRef,
        pickup: {
          lat: pickup.lat + (Math.random() - 0.5) * 0.01, // Add small random variation
          lng: pickup.lng + (Math.random() - 0.5) * 0.01,
          address: pickup.address,
        },
        dropoff: {
          lat: dropoff.lat + (Math.random() - 0.5) * 0.01, // Add small random variation
          lng: dropoff.lng + (Math.random() - 0.5) * 0.01,
          address: dropoff.address,
        },
        status: status || 'pending', // Explicitly ensure status is never null
        paymentType,
        items,
        slaSeconds,
        trackingUrl,
        driverId: assignedDriverId,
        zoneId: 'zone-navi-mumbai',
        assignedAt,
        deliveredAt,
        cancellationSource,
        cancellationReason,
        subscriptionId: null,
        orderType: 'regular',
        customerName: status !== 'pending' ? `Customer ${i}` : null,
        customerPhone: status !== 'pending' ? `+9198765${String(i).padStart(5, '0')}` : null,
        customerEmail: status !== 'pending' ? `customer${i}@example.com` : null,
      });
    }

    console.log('📦 Inserting 70 orders into database...');
    const savedOrders = await orderRepo.save(orders);

    // Count by status
    const statusCounts: Record<string, number> = {};
    savedOrders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    console.log('\n✅ Successfully created 70 orders!\n');
    console.log('📊 Order Status Distribution:');
    Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });

    console.log('\n📍 Location Distribution:');
    const vashiCount = savedOrders.filter((o) =>
      o.pickup.address.toLowerCase().includes('vashi')
    ).length;
    const nerulCount = savedOrders.filter((o) =>
      o.pickup.address.toLowerCase().includes('nerul')
    ).length;
    const otherCount = 70 - vashiCount - nerulCount;
    console.log(`   Vashi: ${vashiCount}`);
    console.log(`   Nerul: ${nerulCount}`);
    console.log(`   Other Navi Mumbai areas: ${otherCount}`);

    console.log('\n✅ All orders created successfully!');
    console.log(`   Total Orders: ${savedOrders.length}`);
    console.log(`   Assigned Orders: ${savedOrders.filter((o) => o.driverId).length}`);
    console.log(`   Unassigned Orders: ${savedOrders.filter((o) => !o.driverId).length}`);

    await AppDataSource.destroy();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during order creation:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    await AppDataSource.destroy();
    process.exit(1);
  }
}

createNaviMumbaiOrders();

