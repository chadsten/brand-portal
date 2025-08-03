#!/bin/bash

# Brand Portal Development Setup Script
set -e

echo "🚀 Setting up Brand Portal development environment..."

# Check if required tools are installed
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is required but not installed. Please install it first."
        exit 1
    fi
}

check_command "node"
check_command "npm"
check_command "docker"
check_command "docker-compose"

echo "✅ Required tools found"

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration values"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start development services
echo "🐳 Starting development services (PostgreSQL & Redis)..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database setup
echo "🗄️  Setting up database..."
npm run db:push

# Generate development data
echo "🌱 Generating development data..."
node -e "
const { initializeDefaultData } = require('./src/server/db/utils.ts');
initializeDefaultData().then(() => {
  console.log('✅ Default data initialized');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Failed to initialize data:', error);
  process.exit(1);
});
"

echo "🎉 Development environment setup complete!"
echo "Run 'npm run dev' to start the development server"
echo "Visit http://localhost:3000 to access the application"