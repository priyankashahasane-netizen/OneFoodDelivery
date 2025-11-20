import 'reflect-metadata';
import jwt from 'jsonwebtoken';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DriverEntity } from '../../modules/drivers/entities/driver.entity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_EXPIRATION = process.env.JWT_EXPIRATION || '30d';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery';

// Demo account phone numbers to check
const DEMO_PHONES = ['+919975008124', '9975008124', '+91-9975008124', '919975008124'];

// Parse expiration string to seconds
function parseExpiration(expiration: string): number {
  const regex = /^(\d+)([smhd])$/;
  const match = expiration.match(regex);

  if (!match) {
    return 2592000; // Default: 30 days in seconds
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 2592000; // Default: 30 days
  }
}

// Generate token
function generateToken(payload: { sub: string; phone: string; role: string }) {
  const expiresInSeconds = parseExpiration(TOKEN_EXPIRATION);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRATION,
  });

  return {
    access_token: token,
    token: token,
    expiresIn: expiresInSeconds,
    expiresAt: expiresAt.toISOString(),
    payload: jwt.decode(token),
  };
}

/**
 * Generate a JWT token for the demo account
 */
async function generateDemoJWT() {
  console.log('🔍 Looking up demo driver account...\n');

  // Initialize database connection
  const AppDataSource = new DataSource({
    type: 'postgres',
    url: DATABASE_URL,
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: false,
  });

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    const driverRepo = AppDataSource.getRepository('DriverEntity');

    // Try to find demo driver by phone number
    let demoDriver = null;
    for (const phone of DEMO_PHONES) {
      demoDriver = await driverRepo.findOne({ where: { phone } });
      if (demoDriver) {
        console.log(`📱 Found demo driver with phone: ${phone}`);
        break;
      }
    }

    if (!demoDriver) {
      console.error('❌ Demo driver not found in database!');
      console.log('💡 Make sure you have run the seed script: npm run seed');
      process.exit(1);
    }

    console.log(`   Name: ${demoDriver.name}`);
    console.log(`   Driver ID: ${demoDriver.id}`);
    console.log(`   Phone: ${demoDriver.phone}\n`);

    // Generate JWT token
    console.log('🔐 Generating JWT token...\n');
    const tokenResponse = generateToken({
      sub: demoDriver.id,
      phone: demoDriver.phone,
      role: 'driver',
    });

    // Display token information
    console.log('✅ Generated Demo Driver JWT Token:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Token Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Token:        ${tokenResponse.token}`);
    console.log(`Expires In:   ${tokenResponse.expiresIn} seconds (${Math.floor(tokenResponse.expiresIn / 86400)} days)`);
    console.log(`Expires At:   ${tokenResponse.expiresAt}`);
    console.log('\n📦 Token Payload:');
    console.log(JSON.stringify(tokenResponse.payload, null, 2));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Usage in API requests:');
    console.log(`   Authorization: Bearer ${tokenResponse.token.substring(0, 50)}...`);
    console.log('\n📝 Copy the token above to use in your API requests.\n');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

generateDemoJWT();

