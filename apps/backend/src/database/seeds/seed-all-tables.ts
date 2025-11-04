import 'reflect-metadata';
import { DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Entities
import { DriverEntity } from '../../modules/drivers/entities/driver.entity.js';
import { DriverBankAccountEntity } from '../../modules/drivers/entities/driver-bank-account.entity.js';
import { OrderEntity } from '../../modules/orders/entities/order.entity.js';
import { ProofOfDeliveryEntity } from '../../modules/orders/entities/proof-of-delivery.entity.js';
import { RoutePlanEntity } from '../../modules/routes/entities/route-plan.entity.js';
import { TrackingPointEntity } from '../../modules/tracking/entities/tracking-point.entity.js';
import { ShiftEntity } from '../../modules/shifts/entities/shift.entity.js';
import { SubscriptionEntity } from '../../modules/subscriptions/entities/subscription.entity.js';
import { SubscriptionExecutionEntity } from '../../modules/subscriptions/entities/subscription-execution.entity.js';
import { NotificationEntity } from '../../modules/notifications/entities/notification.entity.js';
import { DriverWalletEntity } from '../../modules/wallet/entities/driver-wallet.entity.js';
import { WalletTransactionEntity } from '../../modules/wallet/entities/wallet-transaction.entity.js';
import { WithdrawalRequestEntity } from '../../modules/wallet/entities/withdrawal-request.entity.js';
import { AuditLogEntity } from '../../common/audit/audit.entity.js';

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
 * Main seeding function - Creates complete demo data for all tables
 */
async function seedAllTables() {
  console.log('🚀 Starting comprehensive database seeding...');
  console.log('📋 This will create demo data for all tables defined in OpenAPI spec\n');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    // Get repositories
    const driverRepo = AppDataSource.getRepository(DriverEntity);
    const bankAccountRepo = AppDataSource.getRepository(DriverBankAccountEntity);
    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const podRepo = AppDataSource.getRepository(ProofOfDeliveryEntity);
    const routePlanRepo = AppDataSource.getRepository(RoutePlanEntity);
    const trackingRepo = AppDataSource.getRepository(TrackingPointEntity);
    const shiftRepo = AppDataSource.getRepository(ShiftEntity);
    const subscriptionRepo = AppDataSource.getRepository(SubscriptionEntity);
    const subscriptionExecutionRepo = AppDataSource.getRepository(SubscriptionExecutionEntity);
    const notificationRepo = AppDataSource.getRepository(NotificationEntity);
    const walletRepo = AppDataSource.getRepository(DriverWalletEntity);
    const walletTransactionRepo = AppDataSource.getRepository(WalletTransactionEntity);
    const withdrawalRepo = AppDataSource.getRepository(WithdrawalRequestEntity);
    const auditRepo = AppDataSource.getRepository(AuditLogEntity);

    // ==========================================
    // 1. CREATE DEMO DRIVER
    // ==========================================
    console.log('👤 Step 1: Creating/Updating demo driver...');
    const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
    let demoDriver = await driverRepo.findOne({ where: { phone: '+919975008124' } });

    if (!demoDriver) {
      for (const phone of demoPhones) {
        demoDriver = await driverRepo.findOne({ where: { phone } });
        if (demoDriver) break;
      }
    }

    if (!demoDriver) {
      demoDriver = driverRepo.create({
        phone: '+919975008124',
        name: 'Demo Driver',
        vehicleType: 'bike',
        capacity: 5,
        online: true,
        status: 'online',
        latitude: 12.9716,
        longitude: 77.5946,
        lastSeenAt: new Date(),
        ratingAvg: 4.8,
        kycStatus: 'verified',
        ipAddress: '192.168.1.100',
        zoneId: 'zone-bangalore-central',
        metadata: {
          password: await bcrypt.hash('Pri@0110', 10),
          email: 'demo.driver@example.com',
        },
      });
      demoDriver = await driverRepo.save(demoDriver);
      console.log(`   ✅ Created demo driver: ${demoDriver.name} (${demoDriver.phone})`);
    } else {
      demoDriver.status = 'online';
      demoDriver.online = true;
      demoDriver.ratingAvg = 4.8;
      demoDriver.kycStatus = 'verified';
      demoDriver.ipAddress = demoDriver.ipAddress || '192.168.1.100';
      demoDriver.zoneId = demoDriver.zoneId || 'zone-bangalore-central';
      if (!demoDriver.latitude || !demoDriver.longitude) {
        demoDriver.latitude = 12.9716;
        demoDriver.longitude = 77.5946;
      }
      if (!demoDriver.lastSeenAt) {
        demoDriver.lastSeenAt = new Date();
      }
      demoDriver = await driverRepo.save(demoDriver);
      console.log(`   ✅ Updated demo driver: ${demoDriver.name} (${demoDriver.phone})`);
    }
    console.log(`   📋 Driver ID: ${demoDriver.id}\n`);

    // ==========================================
    // 2. CREATE BANK ACCOUNT
    // ==========================================
    console.log('🏦 Step 2: Creating bank account...');
    let bankAccount = await bankAccountRepo.findOne({ where: { driverId: demoDriver.id } });
    if (!bankAccount) {
      bankAccount = bankAccountRepo.create({
        driverId: demoDriver.id,
        accountHolderName: 'Demo Driver',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        branchName: 'MG Road Branch',
        upiId: 'demo.driver@paytm',
        isVerified: true,
      });
      bankAccount = await bankAccountRepo.save(bankAccount);
      console.log(`   ✅ Created bank account: ${bankAccount.accountNumber}`);
    } else {
      console.log(`   ℹ️  Bank account already exists`);
    }
    console.log(`   📋 Bank Account ID: ${bankAccount.id}\n`);

    // ==========================================
    // 3. CREATE WALLET
    // ==========================================
    console.log('💰 Step 3: Creating driver wallet...');
    let wallet = await walletRepo.findOne({ where: { driverId: demoDriver.id } });
    if (!wallet) {
      wallet = walletRepo.create({
        driverId: demoDriver.id,
        balance: 1250.75,
        currency: 'INR',
      });
      wallet = await walletRepo.save(wallet);
      console.log(`   ✅ Created wallet with balance: ₹${wallet.balance}`);
    } else {
      wallet.balance = 1250.75;
      wallet = await walletRepo.save(wallet);
      console.log(`   ✅ Updated wallet balance: ₹${wallet.balance}`);
    }
    console.log(`   📋 Wallet ID: ${wallet.id}\n`);

    // ==========================================
    // 4. CREATE WALLET TRANSACTIONS
    // ==========================================
    console.log('💳 Step 4: Creating wallet transactions...');
    const existingTransactions = await walletTransactionRepo.find({ where: { walletId: wallet.id } });
    if (existingTransactions.length === 0) {
      // We'll link order IDs after orders are created, so save orders first
      const transactions = await walletTransactionRepo.save([
        {
          walletId: wallet.id,
          orderId: null,
          type: 'credit',
          category: 'bonus',
          amount: 100.00,
          description: 'Welcome bonus for new driver',
        },
        {
          walletId: wallet.id,
          orderId: null,
          type: 'credit',
          category: 'delivery_fee',
          amount: 50.00,
          description: 'Delivery fee for order #001',
        },
        {
          walletId: wallet.id,
          orderId: null,
          type: 'credit',
          category: 'delivery_fee',
          amount: 75.00,
          description: 'Delivery fee for order #002',
        },
        {
          walletId: wallet.id,
          orderId: null,
          type: 'credit',
          category: 'incentive',
          amount: 25.00,
          description: 'On-time delivery bonus',
        },
        {
          walletId: wallet.id,
          orderId: null,
          type: 'debit',
          category: 'withdrawal',
          amount: 500.00,
          description: 'Withdrawal to bank account',
        },
        {
          walletId: wallet.id,
          orderId: null,
          type: 'debit',
          category: 'penalty',
          amount: 10.00,
          description: 'Late delivery penalty',
        },
      ]);
      console.log(`   ✅ Created ${transactions.length} wallet transactions`);
    } else {
      console.log(`   ℹ️  ${existingTransactions.length} transactions already exist`);
    }

    // ==========================================
    // 5. CREATE WITHDRAWAL REQUESTS
    // ==========================================
    console.log('\n💸 Step 5: Creating withdrawal requests...');
    const existingWithdrawals = await withdrawalRepo.find({ where: { driverId: demoDriver.id } });
    if (existingWithdrawals.length === 0) {
      const withdrawals = await withdrawalRepo.save([
        {
          driverId: demoDriver.id,
          bankAccountId: bankAccount.id,
          amount: 500.00,
          status: 'completed',
          requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          processedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
          txnRef: 'TXN123456789',
          remarks: 'Processed successfully',
        },
        {
          driverId: demoDriver.id,
          bankAccountId: bankAccount.id,
          amount: 750.00,
          status: 'processing',
          requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          processedAt: null,
          txnRef: null,
          remarks: null,
        },
      ]);
      console.log(`   ✅ Created ${withdrawals.length} withdrawal requests`);
    } else {
      console.log(`   ℹ️  ${existingWithdrawals.length} withdrawal requests already exist`);
    }

    // ==========================================
    // 6. CREATE ORDERS
    // ==========================================
    console.log('\n📦 Step 6: Creating orders...');
    const existingOrders = await orderRepo.find({ where: { driverId: demoDriver.id }, take: 1 });
    let orders: OrderEntity[] = [];
    
    if (existingOrders.length === 0) {
      orders = await orderRepo.save([
        {
          externalRef: 'DEMO-001',
          pickup: { lat: 12.9716, lng: 77.5946, address: 'Pizza Hut, MG Road, Bengaluru' },
          dropoff: { lat: 12.9558, lng: 77.6077, address: 'Prestige Tech Park, Whitefield' },
          status: 'assigned',
          paymentType: 'cod',
          items: [{ name: 'Margherita Pizza', quantity: 1, price: 299 }],
          slaSeconds: 2700,
          trackingUrl: 'https://track.example.com/orders/DEMO-001',
          driverId: demoDriver.id,
          zoneId: demoDriver.zoneId || 'zone-bangalore-central',
          assignedAt: new Date(),
          subscriptionId: null,
          cancellationSource: null,
          cancellationReason: null,
          deliveredAt: null,
        },
        {
          externalRef: 'DEMO-002',
          pickup: { lat: 12.9352, lng: 77.6245, address: 'McDonald\'s, Koramangala' },
          dropoff: { lat: 12.9141, lng: 77.6411, address: 'HSR Layout Sector 2' },
          status: 'picked_up',
          paymentType: 'prepaid',
          items: [{ name: 'Big Mac Combo', quantity: 2, price: 780 }],
          slaSeconds: 1800,
          trackingUrl: 'https://track.example.com/orders/DEMO-002',
          driverId: demoDriver.id,
          zoneId: demoDriver.zoneId || 'zone-bangalore-central',
          assignedAt: new Date(Date.now() - 300000),
          subscriptionId: null,
          cancellationSource: null,
          cancellationReason: null,
          deliveredAt: null,
        },
        {
          externalRef: 'DEMO-003',
          pickup: { lat: 12.9667, lng: 77.5667, address: 'Domino\'s, Rajaji Nagar' },
          dropoff: { lat: 12.9822, lng: 77.5946, address: 'Columbia Asia Hospital, Hebbal' },
          status: 'delivered',
          paymentType: 'prepaid',
          items: [{ name: 'Pepperoni Pizza', quantity: 1, price: 399 }],
          slaSeconds: 2400,
          trackingUrl: 'https://track.example.com/orders/DEMO-003',
          driverId: demoDriver.id,
          zoneId: demoDriver.zoneId || 'zone-bangalore-central',
          assignedAt: new Date(Date.now() - 3600000),
          deliveredAt: new Date(Date.now() - 1800000),
          subscriptionId: null,
          cancellationSource: null,
          cancellationReason: null,
        },
        {
          externalRef: 'DEMO-004',
          pickup: { lat: 12.9279, lng: 77.6271, address: 'KFC, Indiranagar' },
          dropoff: { lat: 12.9698, lng: 77.6469, address: 'Mantri Square Mall, Malleshwaram' },
          status: 'cancelled',
          paymentType: 'cod',
          items: [{ name: 'Chicken Bucket', quantity: 1, price: 599 }],
          slaSeconds: 2100,
          trackingUrl: null,
          driverId: null,
          zoneId: 'zone-bangalore-central',
          assignedAt: null,
          subscriptionId: null,
          cancellationSource: 'customer',
          cancellationReason: 'Customer requested cancellation',
          deliveredAt: null,
        },
      ]);
      console.log(`   ✅ Created ${orders.length} orders`);
    } else {
      orders = await orderRepo.find({ where: { driverId: demoDriver.id } });
      console.log(`   ℹ️  ${orders.length} orders already exist`);
    }

    // Update wallet transactions with order IDs
    const deliveredOrders = orders.filter(o => o.status === 'delivered' && o.driverId === demoDriver.id);
    const assignedOrdersForTxn = orders.filter(o => ['assigned', 'picked_up', 'delivered'].includes(o.status) && o.driverId === demoDriver.id);
    
    if (deliveredOrders.length > 0 && assignedOrdersForTxn.length > 0) {
      const creditTxns = await walletTransactionRepo.find({ 
        where: { walletId: wallet.id, type: 'credit', category: 'delivery_fee' },
        order: { createdAt: 'ASC' }
      });
      
      // Link delivery fee transactions to orders
      for (let i = 0; i < Math.min(creditTxns.length, assignedOrdersForTxn.length); i++) {
        if (!creditTxns[i].orderId) {
          creditTxns[i].orderId = assignedOrdersForTxn[i].id;
          await walletTransactionRepo.save(creditTxns[i]);
        }
      }
      
      // Link incentive transaction to a delivered order
      const incentiveTxn = await walletTransactionRepo.findOne({ 
        where: { walletId: wallet.id, category: 'incentive' } 
      });
      if (incentiveTxn && !incentiveTxn.orderId && deliveredOrders.length > 0) {
        incentiveTxn.orderId = deliveredOrders[0].id;
        await walletTransactionRepo.save(incentiveTxn);
      }
    }

    // ==========================================
    // 7. CREATE PROOF OF DELIVERY
    // ==========================================
    console.log('\n📸 Step 7: Creating proof of delivery records...');
    const deliveredOrdersForPod = orders.filter(o => o.status === 'delivered');
    for (const order of deliveredOrdersForPod) {
      const existingPod = await podRepo.findOne({ where: { orderId: order.id } });
      if (!existingPod) {
        const pod = podRepo.create({
          orderId: order.id,
          driverId: order.driverId,
          photoUrl: 'https://example.com/pod/photos/demo-pod.jpg',
          signatureUrl: 'https://example.com/pod/signatures/demo-signature.jpg',
          notes: 'Delivered successfully to customer',
          otpCode: '123456',
        });
        await podRepo.save(pod);
        console.log(`   ✅ Created POD for order ${order.externalRef}`);
      }
    }

    // ==========================================
    // 8. CREATE ROUTE PLANS
    // ==========================================
    console.log('\n🗺️  Step 8: Creating route plans...');
    const assignedOrders = orders.filter(o => o.driverId === demoDriver.id && ['assigned', 'picked_up'].includes(o.status));
    let savedRoutePlans: RoutePlanEntity[] = [];
    
    // Fetch existing route plans for demo driver
    const existingRoutePlans = await routePlanRepo.find({ where: { driverId: demoDriver.id } });
    savedRoutePlans.push(...existingRoutePlans);
    
    for (const order of assignedOrders) {
      const existingRoute = await routePlanRepo.findOne({ where: { orderId: order.id } });
      if (!existingRoute) {
        const routePlan = routePlanRepo.create({
          driverId: demoDriver.id,
          orderId: order.id,
          status: 'active',
          stops: [
            { lat: order.pickup.lat, lng: order.pickup.lng, orderId: order.id, address: order.pickup.address },
            { lat: order.dropoff.lat, lng: order.dropoff.lng, orderId: order.id, address: order.dropoff.address },
          ],
          sequence: [0, 1],
          polyline: 'example_polyline_string_encoded_route_data_here',
          totalDistanceKm: 5.5,
          estimatedDurationSec: 1800,
          etaPerStop: [new Date(Date.now() + 600000).toISOString(), new Date(Date.now() + 2400000).toISOString()],
          assignedAt: new Date(),
          completedAt: null,
          meta: { optimized: true, algorithm: 'tsp' },
          rawResponse: {
            provider: 'optimoroute',
            routeId: `route-${order.id}`,
            waypoints: 2,
            distance: 5.5,
            duration: 1800,
          },
          provider: 'optimoroute',
        });
        const saved = await routePlanRepo.save(routePlan);
        savedRoutePlans.push(saved);
        console.log(`   ✅ Created route plan for order ${order.externalRef}`);
      } else if (!savedRoutePlans.find(rp => rp.id === existingRoute.id)) {
        savedRoutePlans.push(existingRoute);
      }
    }

    // ==========================================
    // 9. CREATE TRACKING POINTS
    // ==========================================
    console.log('\n📍 Step 9: Creating tracking points...');
    const inTransitOrders = orders.filter(o => ['picked_up', 'delivered'].includes(o.status) && o.driverId === demoDriver.id);
    for (const order of inTransitOrders) {
      const existingPoints = await trackingRepo.count({ where: { orderId: order.id } });
      if (existingPoints === 0) {
        const points = [];
        const numPoints = 10;
        for (let i = 0; i < numPoints; i++) {
          const progress = i / numPoints;
          const lat = order.pickup.lat + (order.dropoff.lat - order.pickup.lat) * progress;
          const lng = order.pickup.lng + (order.dropoff.lng - order.pickup.lng) * progress;
          points.push({
            orderId: order.id,
            driverId: demoDriver.id,
            latitude: lat,
            longitude: lng,
            speed: 25 + Math.random() * 10,
            heading: 135 + Math.random() * 90,
            recordedAt: new Date(Date.now() - (numPoints - i) * 120000),
            metadata: {
              accuracy: 5 + Math.random() * 5,
              altitude: 900 + Math.random() * 50,
              source: 'gps',
              batteryLevel: 80 - i * 2,
            },
          });
        }
        await trackingRepo.save(points);
        console.log(`   ✅ Created ${points.length} tracking points for order ${order.externalRef}`);
      }
    }

    // ==========================================
    // 10. CREATE SUBSCRIPTIONS
    // ==========================================
    console.log('\n📅 Step 10: Creating subscriptions...');
    const existingSubscriptions = await subscriptionRepo.find({ where: { driverId: demoDriver.id } });
    let savedSubscription: SubscriptionEntity | null = null;
    if (existingSubscriptions.length === 0) {
      // Link to a route plan if available
      const routePlanId = savedRoutePlans.length > 0 ? savedRoutePlans[0].id : null;
      
      const subscription = subscriptionRepo.create({
        orderTemplateId: 'template-daily-001',
        driverId: demoDriver.id,
        routePlanId: routePlanId,
        frequency: 'daily',
        daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
        startDate: new Date(),
        endDate: null,
        nextDeliveryAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        active: true,
      });
      savedSubscription = await subscriptionRepo.save(subscription);
      console.log(`   ✅ Created subscription: ${savedSubscription.id}`);

      // Create subscription executions - multiple entries for more realistic data
      const existingExecutions = await subscriptionExecutionRepo.find({ where: { subscriptionId: savedSubscription.id } });
      if (existingExecutions.length === 0) {
        const deliveredOrder = orders.find(o => o.status === 'delivered' && o.driverId === demoDriver.id);
        const executions = await subscriptionExecutionRepo.save([
          {
            subscriptionId: savedSubscription.id,
            orderId: deliveredOrder?.id || null,
            scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'scheduled',
          },
          {
            subscriptionId: savedSubscription.id,
            orderId: null,
            scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            status: 'scheduled',
          },
          {
            subscriptionId: savedSubscription.id,
            orderId: deliveredOrder?.id || null,
            scheduledFor: new Date(Date.now() - 24 * 60 * 60 * 1000),
            status: 'completed',
          },
        ]);
        console.log(`   ✅ Created ${executions.length} subscription executions`);
      } else {
        console.log(`   ℹ️  ${existingExecutions.length} subscription executions already exist`);
      }
    } else {
      savedSubscription = existingSubscriptions[0];
      console.log(`   ℹ️  ${existingSubscriptions.length} subscriptions already exist`);
      
      // Check and create subscription executions if they don't exist
      const existingExecutions = await subscriptionExecutionRepo.find({ where: { subscriptionId: savedSubscription.id } });
      if (existingExecutions.length === 0) {
        const deliveredOrder = orders.find(o => o.status === 'delivered' && o.driverId === demoDriver.id);
        const executions = await subscriptionExecutionRepo.save([
          {
            subscriptionId: savedSubscription.id,
            orderId: deliveredOrder?.id || null,
            scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'scheduled',
          },
          {
            subscriptionId: savedSubscription.id,
            orderId: null,
            scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            status: 'scheduled',
          },
          {
            subscriptionId: savedSubscription.id,
            orderId: deliveredOrder?.id || null,
            scheduledFor: new Date(Date.now() - 24 * 60 * 60 * 1000),
            status: 'completed',
          },
        ]);
        console.log(`   ✅ Created ${executions.length} subscription executions for existing subscription`);
      }
    }

    // ==========================================
    // 11. CREATE NOTIFICATIONS
    // ==========================================
    console.log('\n🔔 Step 11: Creating notifications...');
    // Check if notifications exist for demo driver by checking recipients array
    const allNotifications = await notificationRepo.find();
    const existingNotifications = allNotifications.filter(n => 
      Array.isArray(n.recipients) && n.recipients.includes(demoDriver.phone)
    );
    if (existingNotifications.length === 0) {
      const notifications = await notificationRepo.save([
        {
          event: 'order.assigned',
          orderId: orders.find(o => o.status === 'assigned')?.id || null,
          recipients: [demoDriver.phone],
          payload: { message: 'New order assigned to you', orderRef: 'DEMO-001' },
        },
        {
          event: 'order.picked_up',
          orderId: orders.find(o => o.status === 'picked_up')?.id || null,
          recipients: [demoDriver.phone],
          payload: { message: 'Order picked up successfully', orderRef: 'DEMO-002' },
        },
        {
          event: 'order.delivered',
          orderId: orders.find(o => o.status === 'delivered')?.id || null,
          recipients: [demoDriver.phone],
          payload: { message: 'Order delivered successfully', orderRef: 'DEMO-003', amount: 399 },
        },
        {
          event: 'wallet.credit',
          orderId: null,
          recipients: [demoDriver.phone],
          payload: { amount: 50.00, message: 'Payment credited to wallet', transactionId: 'TXN001' },
        },
        {
          event: 'wallet.debit',
          orderId: null,
          recipients: [demoDriver.phone],
          payload: { amount: 500.00, message: 'Withdrawal processed', transactionId: 'TXN123456789' },
        },
        {
          event: 'shift.start',
          orderId: null,
          recipients: [demoDriver.phone],
          payload: { message: 'Your shift has started', shiftName: 'Morning Shift' },
        },
      ]);
      console.log(`   ✅ Created ${notifications.length} notifications`);
    } else {
      console.log(`   ℹ️  ${existingNotifications.length} notifications already exist for demo driver`);
    }

    // ==========================================
    // 12. CREATE SHIFTS
    // ==========================================
    console.log('\n⏰ Step 12: Creating shifts...');
    const existingShifts = await shiftRepo.find({ where: { driverId: demoDriver.id } });
    if (existingShifts.length === 0) {
      // Create shifts linked to demo driver
      const shifts = await shiftRepo.save([
        { 
          name: 'Morning Shift', 
          startTime: '08:00:00', 
          endTime: '16:00:00', 
          status: 1, 
          driverId: demoDriver.id, 
          zoneId: demoDriver.zoneId || 'zone-bangalore-central' 
        },
        { 
          name: 'Afternoon Shift', 
          startTime: '12:00:00', 
          endTime: '20:00:00', 
          status: 1, 
          driverId: null, 
          zoneId: demoDriver.zoneId || 'zone-bangalore-central' 
        },
        { 
          name: 'Evening Shift', 
          startTime: '16:00:00', 
          endTime: '00:00:00', 
          status: 1, 
          driverId: null, 
          zoneId: demoDriver.zoneId || 'zone-bangalore-central' 
        },
      ]);
      console.log(`   ✅ Created ${shifts.length} shifts (1 linked to demo driver)`);
    } else {
      console.log(`   ℹ️  ${existingShifts.length} shifts already exist for demo driver`);
    }

    // ==========================================
    // 13. CREATE AUDIT LOGS
    // ==========================================
    console.log('\n📝 Step 13: Creating audit logs...');
    const existingAuditLogs = await auditRepo.find({ where: { actor: demoDriver.id } });
    if (existingAuditLogs.length === 0) {
      const assignedOrder = orders.find(o => o.status === 'assigned' && o.driverId === demoDriver.id);
      const pickedUpOrder = orders.find(o => o.status === 'picked_up' && o.driverId === demoDriver.id);
      const deliveredOrder = orders.find(o => o.status === 'delivered' && o.driverId === demoDriver.id);
      
      const auditLogs = await auditRepo.save([
        {
          actor: demoDriver.id,
          action: 'driver.login',
          details: { phone: demoDriver.phone, ipAddress: demoDriver.ipAddress, timestamp: new Date().toISOString() },
        },
        {
          actor: demoDriver.id,
          action: 'driver.profile.update',
          details: { field: 'online', value: true, timestamp: new Date().toISOString() },
        },
        {
          actor: demoDriver.id,
          action: 'order.accept',
          details: { orderId: assignedOrder?.id, externalRef: assignedOrder?.externalRef || 'DEMO-001', timestamp: assignedOrder?.assignedAt?.toISOString() },
        },
        {
          actor: demoDriver.id,
          action: 'order.pickup',
          details: { orderId: pickedUpOrder?.id, externalRef: pickedUpOrder?.externalRef || 'DEMO-002', timestamp: pickedUpOrder?.assignedAt?.toISOString() },
        },
        {
          actor: demoDriver.id,
          action: 'order.deliver',
          details: { orderId: deliveredOrder?.id, externalRef: deliveredOrder?.externalRef || 'DEMO-003', timestamp: deliveredOrder?.deliveredAt?.toISOString() },
        },
        {
          actor: demoDriver.id,
          action: 'wallet.withdrawal.request',
          details: { amount: 500.00, bankAccountId: bankAccount.id, withdrawalId: 'withdrawal-001' },
        },
        {
          actor: demoDriver.id,
          action: 'wallet.transaction',
          details: { type: 'credit', amount: 50.00, category: 'delivery_fee', orderId: deliveredOrder?.id },
        },
        {
          actor: demoDriver.id,
          action: 'route.plan.created',
          details: { routePlanId: savedRoutePlans[0]?.id, orderId: assignedOrder?.id, provider: 'optimoroute' },
        },
        {
          actor: demoDriver.id,
          action: 'subscription.created',
          details: { subscriptionId: savedSubscription?.id, frequency: 'daily', orderTemplateId: 'template-daily-001' },
        },
        {
          actor: demoDriver.id,
          action: 'bank.account.verified',
          details: { bankAccountId: bankAccount.id, accountNumber: bankAccount.accountNumber, verified: true },
        },
        {
          actor: demoDriver.id,
          action: 'shift.start',
          details: { shiftName: 'Morning Shift', zoneId: demoDriver.zoneId, startTime: '08:00:00' },
        },
      ]);
      console.log(`   ✅ Created ${auditLogs.length} audit log entries`);
    } else {
      console.log(`   ℹ️  ${existingAuditLogs.length} audit logs already exist`);
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n🎉 Database seeding complete!');
    console.log('==========================================');
    console.log('📊 Final Statistics:');
    console.log(`   👤 Driver: ${demoDriver.name} (${demoDriver.phone})`);
    console.log(`      ID: ${demoDriver.id}`);
    console.log(`      Status: ${demoDriver.status}`);
    console.log(`      Rating: ${demoDriver.ratingAvg}`);
    console.log(`      KYC Status: ${demoDriver.kycStatus}`);
    console.log(`      Zone: ${demoDriver.zoneId}`);
    console.log(`      IP Address: ${demoDriver.ipAddress}`);
    
    const bankAccountCount = await bankAccountRepo.count({ where: { driverId: demoDriver.id } });
    const walletCount = await walletRepo.count({ where: { driverId: demoDriver.id } });
    const transactionCount = await walletTransactionRepo.count({ where: { walletId: wallet.id } });
    const withdrawalCount = await withdrawalRepo.count({ where: { driverId: demoDriver.id } });
    const orderCount = await orderRepo.count({ where: { driverId: demoDriver.id } });
    const podCount = await podRepo.count({ where: { driverId: demoDriver.id } });
    const routePlanCount = await routePlanRepo.count({ where: { driverId: demoDriver.id } });
    const trackingPointCount = await trackingRepo.count({ where: { driverId: demoDriver.id } });
    const subscriptionCount = await subscriptionRepo.count({ where: { driverId: demoDriver.id } });
    const allDriverSubscriptions = await subscriptionRepo.find({ where: { driverId: demoDriver.id } });
    const subscriptionExecutionCount = allDriverSubscriptions.length > 0
      ? await subscriptionExecutionRepo.count({ 
          where: { subscriptionId: In(allDriverSubscriptions.map(s => s.id)) }
        })
      : 0;
    const shiftCount = await shiftRepo.count({ where: { driverId: demoDriver.id } });
    const allNotificationsForCount = await notificationRepo.find();
    const notificationCount = allNotificationsForCount.filter(n => 
      Array.isArray(n.recipients) && n.recipients.includes(demoDriver.phone)
    ).length;
    const auditLogCount = await auditRepo.count({ where: { actor: demoDriver.id } });
    
    console.log(`   🏦 Bank Accounts: ${bankAccountCount}`);
    console.log(`   💰 Wallets: ${walletCount}`);
    console.log(`   💳 Wallet Transactions: ${transactionCount}`);
    console.log(`   💸 Withdrawal Requests: ${withdrawalCount}`);
    console.log(`   📦 Orders: ${orderCount}`);
    console.log(`   📸 Proof of Deliveries: ${podCount}`);
    console.log(`   🗺️  Route Plans: ${routePlanCount}`);
    console.log(`   📍 Tracking Points: ${trackingPointCount}`);
    console.log(`   📅 Subscriptions: ${subscriptionCount}`);
    console.log(`   📋 Subscription Executions: ${subscriptionExecutionCount}`);
    console.log(`   ⏰ Shifts: ${shiftCount}`);
    console.log(`   🔔 Notifications: ${notificationCount}`);
    console.log(`   📝 Audit Logs: ${auditLogCount}`);
    console.log('==========================================');
    
    console.log('\n🔐 Demo Driver Credentials:');
    console.log(`   Phone: ${demoDriver.phone}`);
    console.log(`   Password: Pri@0110`);
    
    await AppDataSource.destroy();
    console.log('\n✅ Database connection closed');
    console.log('✅ All tables created and demo data seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seedAllTables();

