#!/bin/bash

echo "🔧 Setting up Stack Delivery with local PostgreSQL..."
echo ""

# Create database
echo "Creating database..."
psql postgres -c "DROP DATABASE IF EXISTS stack_delivery;"
psql postgres -c "CREATE DATABASE stack_delivery;"

echo "✅ Database created"
echo ""

# Update .env to use local PostgreSQL
cd apps/backend
cat > .env << 'ENVFILE'
NODE_ENV=development
PORT=3000

# Database (Local PostgreSQL - not Docker)
DATABASE_URL=postgres://futurescapetechnology-priyanka@localhost:5432/stack_delivery

# Redis (Docker)
REDIS_URL=redis://localhost:6379

# Integrations
OPTIMOROUTE_BASE_URL=https://api.optimoroute.com/v1
OPTIMOROUTE_API_KEY=your_optimoroute_key_here
IPSTACK_BASE_URL=http://api.ipstack.com
IPSTACK_API_KEY=your_ipstack_key_here
NOMINATIM_URL=https://nominatim.openstreetmap.org
OSM_TILES_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png

# Tracking Web Base
TRACKING_BASE_URL=http://localhost:3001/track

# Admin Auth
ADMIN_USER=admin@stackdelivery.com
ADMIN_PASS=Admin@123
JWT_SECRET=stack-delivery-jwt-secret-key-2025
ENVFILE

echo "✅ .env configured for local PostgreSQL"
echo ""

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run migrations
echo "Running migrations..."
npm run migration:run

# Seed data
echo "Seeding demo data..."
npm run seed

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Setup Complete!"
echo ""
echo "Start backend with:"
echo "  cd apps/backend && npm run start:dev"
echo ""
echo "Using:"
echo "  - Local PostgreSQL (port 5432)"
echo "  - Docker Redis (port 6379)"
echo "════════════════════════════════════════════════════════════"
