#!/bin/bash

# Brand Portal Deployment Script
set -e

# Configuration
PROJECT_NAME="brand-portal"
ENVIRONMENT=${1:-production}

echo "🚀 Deploying Brand Portal to $ENVIRONMENT..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is required but not installed."
    echo "Install it with: npm install -g vercel"
    exit 1
fi

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    echo "❌ Environment must be 'production' or 'staging'"
    exit 1
fi

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Type check
echo "📝 Running type check..."
npm run typecheck

# Linting
echo "🧹 Running linting..."
npm run check

# Tests
echo "🧪 Running tests..."
npm test

# Security audit
echo "🔒 Running security audit..."
npm audit --audit-level moderate

echo "✅ All checks passed!"

# Deploy to Vercel
echo "📤 Deploying to Vercel ($ENVIRONMENT)..."

if [ "$ENVIRONMENT" = "production" ]; then
    vercel --prod
else
    vercel
fi

# Post-deployment verification
echo "🏥 Running post-deployment health check..."
sleep 30

if [ "$ENVIRONMENT" = "production" ]; then
    DEPLOY_URL=$(vercel ls $PROJECT_NAME --scope=production | grep production | awk '{print $2}' | head -1)
else
    DEPLOY_URL=$(vercel ls $PROJECT_NAME | grep preview | awk '{print $2}' | head -1)
fi

if [ -n "$DEPLOY_URL" ]; then
    echo "🌐 Checking health at: https://$DEPLOY_URL"
    curl -f "https://$DEPLOY_URL/api/health" || {
        echo "❌ Health check failed!"
        exit 1
    }
    echo "✅ Health check passed!"
    echo "🎉 Deployment successful!"
    echo "📱 Application URL: https://$DEPLOY_URL"
else
    echo "⚠️  Could not determine deployment URL"
fi