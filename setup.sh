#!/bin/bash

# Skylith Admin - Local Development Setup Script
# This script helps you quickly set up the project for local development

echo "================================================"
echo "  Skylith Admin - Local Development Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${YELLOW}⚠ MongoDB is not running${NC}"
    echo "Please start MongoDB before continuing"
    echo "Run: sudo systemctl start mongod (Linux) or brew services start mongodb-community (Mac)"
    read -p "Press Enter once MongoDB is running..."
fi

echo ""
echo "Setting up Backend..."
echo "----------------------"

# Setup Backend
cd backend

if [ ! -f ".env" ]; then
    echo "Creating backend .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓ Backend .env created${NC}"
    echo -e "${YELLOW}Note: Please update .env with your configuration${NC}"
else
    echo -e "${YELLOW}Backend .env already exists, skipping...${NC}"
fi

echo "Installing backend dependencies..."
npm install

echo ""
echo "Seeding database with admin user and roles..."
node scripts/seedRoles.js
node scripts/seedAdmin.js

cd ..

echo ""
echo "Setting up Frontend..."
echo "----------------------"

if [ ! -f ".env.local" ]; then
    echo "Creating frontend .env.local file..."
    cp .env.example .env.local
    echo -e "${GREEN}✓ Frontend .env.local created${NC}"
else
    echo -e "${YELLOW}Frontend .env.local already exists, skipping...${NC}"
fi

echo "Installing frontend dependencies..."
npm install

echo ""
echo "================================================"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "================================================"
echo ""
echo "To start the application:"
echo ""
echo "  1. Start Backend (in one terminal):"
echo "     cd backend && node server.js"
echo ""
echo "  2. Start Frontend (in another terminal):"
echo "     npm run dev"
echo ""
echo "  3. Access the application:"
echo "     Frontend: http://localhost:3002"
echo "     Backend:  http://localhost:4002/api"
echo ""
echo "  4. Login with default admin:"
echo "     Email:    admin@gmail.com"
echo "     Password: admin@123"
echo ""
echo "================================================"
echo -e "${YELLOW}⚠  Remember to change the admin password after first login!${NC}"
echo "================================================"
