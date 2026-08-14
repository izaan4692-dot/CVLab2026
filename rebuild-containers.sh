#!/bin/bash
# ============================================
# Script to Delete and Rebuild All Containers
# ============================================

set -e  # Exit on error

echo "Step 1: Stopping and removing all containers..."
docker stop cvlab-app cvlab_backend cvlab_celery cvlab_celery_beat cvlab_redis 2>/dev/null || true
docker rm cvlab-app cvlab_backend cvlab_celery cvlab_celery_beat cvlab_redis 2>/dev/null || true

echo "Step 2: Stopping backend containers via docker-compose..."
cd /home/ubuntu/CVLab---2025/backend
docker compose -f docker-compose.prod.yml down || true

echo "Step 3: Rebuilding backend containers..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "Step 4: Starting backend containers..."
docker compose -f docker-compose.prod.yml up -d

echo "Step 5: Rebuilding frontend container..."
cd /home/ubuntu/CVLab---2025/frontend
docker build -t cvlab---2025-cvlab .

echo "Step 6: Starting frontend container..."
docker run -d --name cvlab-app -p 8001:8001 --network backend_cvlab_network -e NEXT_PUBLIC_API_URL=https://be.cvlab.sa cvlab---2025-cvlab

echo "Step 7: Waiting for containers to start..."
sleep 15

echo ""
echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "=== Health Checks ==="
echo "Backend:"
curl -s http://localhost:8002/health || echo "Backend not ready yet"
echo ""
echo "Frontend:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8001 || echo "Frontend not ready yet"

echo ""
echo "✅ Rebuild complete!"

