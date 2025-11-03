#!/bin/bash

# Stack Delivery - Quick Start Testing Script
# This script will guide you through the testing process

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Stack Delivery - Interactive Testing Guide            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Function to print status
print_status() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC}  $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION installed"
else
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check Flutter
if command -v flutter &> /dev/null; then
    FLUTTER_VERSION=$(flutter --version 2>&1 | head -1 | awk '{print $2}')
    print_success "Flutter $FLUTTER_VERSION installed"
else
    print_error "Flutter not found. Please install Flutter 3.29.3+"
    exit 1
fi

# Check Docker
if docker info &> /dev/null; then
    print_success "Docker is running"
    DOCKER_RUNNING=true
else
    print_warning "Docker is NOT running"
    DOCKER_RUNNING=false
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# If Docker not running, guide user
if [ "$DOCKER_RUNNING" = false ]; then
    print_status "Docker Desktop needs to be started"
    echo ""
    echo "Please follow these steps:"
    echo "  1. Open Docker Desktop application"
    echo "  2. Wait for Docker to start (whale icon in menu bar)"
    echo "  3. Re-run this script"
    echo ""
    echo "To start Docker:"
    echo -e "${BLUE}  open -a Docker${NC}"
    echo ""
    exit 0
fi

# Docker is running, continue with setup
print_status "Starting infrastructure services..."
echo ""

# Start PostgreSQL and Redis
print_status "Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

echo ""
print_status "Waiting for services to be healthy (30 seconds)..."
sleep 30

# Check service status
echo ""
print_status "Checking service status..."
POSTGRES_STATUS=$(docker-compose ps postgres | grep healthy && echo "healthy" || echo "unhealthy")
REDIS_STATUS=$(docker-compose ps redis | grep healthy && echo "healthy" || echo "unhealthy")

if [[ "$POSTGRES_STATUS" == *"healthy"* ]]; then
    print_success "PostgreSQL is healthy"
else
    print_warning "PostgreSQL may not be ready yet"
fi

if [[ "$REDIS_STATUS" == *"healthy"* ]]; then
    print_success "Redis is healthy"
else
    print_warning "Redis may not be ready yet"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Backend setup
print_status "Setting up backend..."
echo ""

cd apps/backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies (this may take 2-3 minutes)..."
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Check if database is seeded
echo ""
print_status "Checking database..."
DB_CHECK=$(docker-compose exec -T postgres psql -U postgres -d stack_delivery -t -c "SELECT COUNT(*) FROM drivers;" 2>/dev/null | xargs || echo "0")

if [ "$DB_CHECK" -eq "10" ]; then
    print_success "Database already seeded (10 drivers found)"
else
    print_status "Running database migrations..."
    npm run migration:run || print_warning "Migrations may have already run"

    echo ""
    print_status "Seeding demo data..."
    npm run seed
    print_success "Demo data loaded"
fi

cd ../..

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo ""
echo "Next Steps:"
echo ""
echo "1️⃣  Start Backend API (in a NEW terminal):"
echo -e "   ${BLUE}cd apps/backend && npm run start:dev${NC}"
echo ""
echo "2️⃣  Start Tracking Web (in a NEW terminal):"
echo -e "   ${BLUE}cd apps/tracking-web && npm install && npm run dev${NC}"
echo ""
echo "3️⃣  Start Admin Dashboard (in a NEW terminal):"
echo -e "   ${BLUE}cd apps/admin-dashboard && npm install && npm run dev${NC}"
echo ""
echo "4️⃣  Run Flutter App (in a NEW terminal):"
echo -e "   ${BLUE}flutter run -d macos${NC}"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📚 Documentation:"
echo "   - Testing Guide: TESTING_CHECKLIST.md"
echo "   - Setup Guide: SETUP_AND_TEST.md"
echo "   - Demo Credentials: DEMO_CREDENTIALS.md"
echo ""
echo "🔗 Service URLs (after starting):"
echo "   - Backend API: http://localhost:3000"
echo "   - API Docs: http://localhost:3000/api-docs"
echo "   - Tracking: http://localhost:3001"
echo "   - Admin: http://localhost:3002"
echo ""
echo "👤 Demo Login:"
echo "   - Admin: admin@stackdelivery.com / Admin@123"
echo "   - Driver: +1234567890 / OTP: 123456"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
