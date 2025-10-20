#!/bin/bash

# Quick deployment script for YATRIK ERP
echo "🚀 Deploying YATRIK ERP to yatrikerp.live..."

# Build and deploy
docker-compose down
docker-compose up -d --build

# Wait for services to start
sleep 30

# Check health
echo "🔍 Checking application health..."
curl -f http://localhost:5000/api/health && echo "✅ Application is healthy!" || echo "❌ Application health check failed"

# Show running containers
echo "📦 Running containers:"
docker-compose ps

echo "✅ Deployment complete! Visit https://yatrikerp.live"