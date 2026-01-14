#!/bin/bash

# Script to create admin user
# Usage: ./createAdmin.sh

cd "$(dirname "$0")/.."

echo "Creating admin user..."
echo "Email: admin@gmail.com"
echo "Password: admin@123"
echo ""

node scripts/seedAdmin.js

if [ $? -eq 0 ]; then
    echo ""
    echo "Admin user created successfully!"
else
    echo ""
    echo "Failed to create admin user. Make sure:"
    echo "1. MongoDB is running"
    echo "2. .env file exists with MONGODB_URI"
    echo "3. Dependencies are installed (npm install)"
fi

