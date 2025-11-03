#!/bin/bash

# Stack Delivery - Quick Start Script
# This script starts all services in the correct order

set -e

echo "🚀 Stack Delivery - Starting All Services"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Error: Docker is not running${NC}"
  echo "Please start Docker Desktop and try again."
  exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Step 1: Start infrastructure services
echo "📦 Step 1/5: Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

echo "⏳ Waiting for services to be healthy (30 seconds)..."
sleep 30

# Check health
if docker-compose ps | grep -q "postgres.*healthy"; then
  echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
  echo -e "${YELLOW}⚠️  PostgreSQL may not be fully ready yet${NC}"
fi

if docker-compose ps | grep -q "redis.*healthy"; then
  echo -e "${GREEN}✅ Redis is ready${NC}"
else
  echo -e "${YELLOW}⚠️  Redis may not be fully ready yet${NC}"
fi
echo ""

# Step 2: Set up backend
echo "🔧 Step 2/5: Setting up backend..."
cd apps/backend

if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠️  No .env file found, using .env.example${NC}"
  cp .env.example .env 2>/dev/null || echo "No .env.example found either"
fi

echo -e "${GREEN}✅ Backend dependencies ready${NC}"
echo ""

# Step 3: Run migrations and seed
echo "🗄️  Step 3/5: Setting up database..."

# Check if migrations table exists
if docker-compose exec -T postgres psql -U postgres -d stack_delivery -c "\dt" 2>/dev/null | grep -q "migrations"; then
  echo "Database already initialized"
else
  echo "Running migrations..."
  npm run migration:run || echo -e "${YELLOW}⚠️  Migrations failed or already run${NC}"
fi

# Check if drivers table has data
if docker-compose exec -T postgres psql -U postgres -d stack_delivery -c "SELECT COUNT(*) FROM drivers;" 2>/dev/null | grep -q "10"; then
  echo "Database already seeded"
else
  echo "Seeding demo data..."
  npm run seed || echo -e "${YELLOW}⚠️  Seed failed or already run${NC}"
fi

echo -e "${GREEN}✅ Database ready${NC}"
echo ""

# Step 4: Start backend
echo "🚀 Step 4/5: Starting backend server..."
npm run start:dev > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to start (10 seconds)..."
sleep 10

if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Backend is running at http://localhost:3000${NC}"
else
  echo -e "${YELLOW}⚠️  Backend may still be starting...${NC}"
fi

cd ../..
echo ""

# Step 5: Start frontend services (optional)
echo "🌐 Step 5/5: Starting frontend services (optional)..."
echo ""
echo -e "${YELLOW}To start Tracking Web:${NC}"
echo "  cd apps/tracking-web && npm install && npm run dev"
echo ""
echo -e "${YELLOW}To start Admin Dashboard:${NC}"
echo "  cd apps/admin-dashboard && npm install && npm run dev"
echo ""
echo -e "${YELLOW}To start Flutter App:${NC}"
echo "  flutter pub get && flutter run"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Stack Delivery is ready!${NC}"
echo ""
echo "📚 Services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - Backend API: http://localhost:3000"
echo "  - Swagger Docs: http://localhost:3000/api-docs"
echo "  - Health Check: http://localhost:3000/api/health"
echo ""
echo "👤 Demo Credentials:"
echo "  - Driver: +1234567890 / OTP: 123456"
echo "  - Admin: admin@stackdelivery.com / Admin@123"
echo ""
echo "📖 Documentation:"
echo "  - Setup Guide: SETUP_AND_TEST.md"
echo "  - Demo Credentials: DEMO_CREDENTIALS.md"
echo "  - Gap Analysis: GAP_ANALYSIS.md"
echo ""
echo "🧪 Quick Tests:"
echo "  curl http://localhost:3000/api/health"
echo "  curl -X POST http://localhost:3000/api/webhooks/test"
echo ""
echo "To stop all services:"
echo "  docker-compose down"
echo "  kill $BACKEND_PID"
echo ""
