#!/usr/bin/env node

/**
 * Script to generate a new JWT token for testing purposes
 * 
 * Usage:
 *   node scripts/generate-jwt-token.js --role admin --username admin
 *   node scripts/generate-jwt-token.js --role driver --driverId driver-123 --phone +1234567890
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_EXPIRATION = process.env.JWT_EXPIRATION || '30d';

// Parse expiration string to seconds
function parseExpiration(expiration) {
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
function generateToken(payload) {
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

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i]?.replace('--', '');
  const value = args[i + 1];
  if (key && value) {
    options[key] = value;
  }
}

// Generate token based on role
let tokenResponse;

if (options.role === 'admin') {
  const username = options.username || 'admin';
  tokenResponse = generateToken({
    sub: 'admin',
    username: username,
    role: 'admin',
  });
  console.log('\n✅ Generated Admin JWT Token:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
} else if (options.role === 'driver') {
  const driverId = options.driverId || crypto.randomUUID();
  const phone = options.phone || '+1234567890';
  tokenResponse = generateToken({
    sub: driverId,
    phone: phone,
    role: 'driver',
  });
  console.log('\n✅ Generated Driver JWT Token:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
} else {
  console.error('\n❌ Error: Invalid role. Use --role admin or --role driver');
  console.log('\nUsage:');
  console.log('  Admin:   node scripts/generate-jwt-token.js --role admin --username admin');
  console.log('  Driver:  node scripts/generate-jwt-token.js --role driver --driverId driver-123 --phone +1234567890');
  process.exit(1);
}

// Display token information
console.log('\n📋 Token Details:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Token:        ${tokenResponse.token}`);
console.log(`Expires In:    ${tokenResponse.expiresIn} seconds (${Math.floor(tokenResponse.expiresIn / 86400)} days)`);
console.log(`Expires At:    ${tokenResponse.expiresAt}`);
console.log('\n📦 Token Payload:');
console.log(JSON.stringify(tokenResponse.payload, null, 2));
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n💡 Usage in API requests:');
console.log(`   Authorization: Bearer ${tokenResponse.token.substring(0, 50)}...`);
console.log('\n');

