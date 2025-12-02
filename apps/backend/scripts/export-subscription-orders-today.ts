import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

// Entities
import { DriverEntity } from '../src/modules/drivers/entities/driver.entity.js';
import { OrderEntity } from '../src/modules/orders/entities/order.entity.js';
import { RoutePlanEntity } from '../src/modules/routes/entities/route-plan.entity.js';
import { TrackingPointEntity } from '../src/modules/tracking/entities/tracking-point.entity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * TypeORM DataSource configuration
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery',
  entities: [
    DriverEntity,
    OrderEntity,
    RoutePlanEntity,
    TrackingPointEntity,
  ],
  synchronize: false,
  logging: false,
});

/**
 * Escape CSV field value
 */
function escapeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  // If the field contains comma, newline, or double quote, wrap it in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Convert order to CSV row
 */
function orderToCsvRow(order: OrderEntity): string {
  const pickupAddress = typeof order.pickup === 'object' && order.pickup !== null 
    ? (order.pickup as any).address || '' 
    : '';
  const pickupLat = typeof order.pickup === 'object' && order.pickup !== null 
    ? (order.pickup as any).lat || '' 
    : '';
  const pickupLng = typeof order.pickup === 'object' && order.pickup !== null 
    ? (order.pickup as any).lng || '' 
    : '';
  
  const dropoffAddress = typeof order.dropoff === 'object' && order.dropoff !== null 
    ? (order.dropoff as any).address || '' 
    : '';
  const dropoffLat = typeof order.dropoff === 'object' && order.dropoff !== null 
    ? (order.dropoff as any).lat || '' 
    : '';
  const dropoffLng = typeof order.dropoff === 'object' && order.dropoff !== null 
    ? (order.dropoff as any).lng || '' 
    : '';
  
  const items = order.items ? JSON.stringify(order.items) : '';
  
  return [
    escapeCsvField(order.id),
    escapeCsvField(order.externalRef),
    escapeCsvField(order.status),
    escapeCsvField(order.orderType),
    escapeCsvField(order.paymentType),
    escapeCsvField(order.deliveryCharge),
    escapeCsvField(order.customerName),
    escapeCsvField(order.customerPhone),
    escapeCsvField(order.customerEmail),
    escapeCsvField(pickupAddress),
    escapeCsvField(pickupLat),
    escapeCsvField(pickupLng),
    escapeCsvField(dropoffAddress),
    escapeCsvField(dropoffLat),
    escapeCsvField(dropoffLng),
    escapeCsvField(items),
    escapeCsvField(order.driverId),
    escapeCsvField(order.subscriptionId),
    escapeCsvField(order.zoneId),
    escapeCsvField(order.slaSeconds),
    escapeCsvField(order.trackingUrl),
    escapeCsvField(order.assignedAt ? order.assignedAt.toISOString() : ''),
    escapeCsvField(order.deliveredAt ? order.deliveredAt.toISOString() : ''),
    escapeCsvField(order.cancellationSource),
    escapeCsvField(order.cancellationReason),
    escapeCsvField(order.createdAt.toISOString()),
    escapeCsvField(order.updatedAt.toISOString()),
  ].join(',');
}

/**
 * Export subscription orders from today to CSV
 */
async function exportSubscriptionOrdersToday() {
  console.log('🚀 Starting export of subscription orders from today...\n');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    const orderRepo = AppDataSource.getRepository(OrderEntity);

    // Get today's date range (start and end of today in UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    console.log(`📅 Querying orders from: ${today.toISOString()} to ${tomorrow.toISOString()}`);
    console.log(`🔍 Filter: orderType = 'subscription'\n`);

    // Query orders with orderType='subscription' created today
    const orders = await orderRepo
      .createQueryBuilder('order')
      .where('order.orderType = :orderType', { orderType: 'subscription' })
      .andWhere('order.createdAt >= :startDate', { startDate: today })
      .andWhere('order.createdAt < :endDate', { endDate: tomorrow })
      .orderBy('order.createdAt', 'DESC')
      .getMany();

    console.log(`✅ Found ${orders.length} subscription orders from today\n`);

    if (orders.length === 0) {
      console.log('⚠️  No subscription orders found for today. Exiting...');
      await AppDataSource.destroy();
      return;
    }

    // CSV Headers
    const headers = [
      'ID',
      'External Ref',
      'Status',
      'Order Type',
      'Payment Type',
      'Delivery Charge',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Pickup Address',
      'Pickup Lat',
      'Pickup Lng',
      'Dropoff Address',
      'Dropoff Lat',
      'Dropoff Lng',
      'Items',
      'Driver ID',
      'Subscription ID',
      'Zone ID',
      'SLA Seconds',
      'Tracking URL',
      'Assigned At',
      'Delivered At',
      'Cancellation Source',
      'Cancellation Reason',
      'Created At',
      'Updated At',
    ];

    // Generate CSV content
    const csvRows = [
      headers.join(','),
      ...orders.map(order => orderToCsvRow(order))
    ];

    const csvContent = csvRows.join('\n');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `subscription-orders-${timestamp}.csv`;
    const filepath = path.resolve(__dirname, filename);

    // Write CSV file
    fs.writeFileSync(filepath, csvContent, 'utf-8');

    console.log(`✅ CSV file created successfully!`);
    console.log(`📁 File location: ${filepath}`);
    console.log(`📊 Total orders exported: ${orders.length}\n`);

    // Print summary
    console.log('📈 Summary:');
    console.log(`   - Total orders: ${orders.length}`);
    
    const statusCounts: Record<string, number> = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    console.log('   - Status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`     • ${status}: ${count}`);
    });

    const assignedCount = orders.filter(o => o.driverId !== null).length;
    console.log(`   - Assigned orders: ${assignedCount}`);
    console.log(`   - Unassigned orders: ${orders.length - assignedCount}\n`);

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    console.log('✨ Export completed successfully!');

  } catch (error) {
    console.error('❌ Error exporting subscription orders:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

// Run the export
exportSubscriptionOrdersToday();

