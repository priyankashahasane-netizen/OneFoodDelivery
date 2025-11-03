#!/usr/bin/env node

/**
 * Script to generate a secure JWT secret
 * Usage: node scripts/generate-jwt-secret.js
 */

import crypto from 'crypto';

function generateJWTSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function main() {
  const secret = generateJWTSecret();
  
  console.log('\n🔐 Generated JWT Secret:');
  console.log('═'.repeat(80));
  console.log(secret);
  console.log('═'.repeat(80));
  console.log('\n📝 Add this to your .env file:');
  console.log(`JWT_SECRET=${secret}`);
  console.log('\n⚠️  Keep this secret secure and never commit it to version control!');
  console.log('    Make sure .env is in your .gitignore file.\n');
  
  return secret;
}

main();

export { generateJWTSecret };

