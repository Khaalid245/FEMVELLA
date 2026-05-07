#!/bin/bash

# Test runner script for Femvelle
set -e

echo "🧪 Running Femvelle Test Suite"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Backend Tests
echo -e "\n${YELLOW}Backend Tests${NC}"
echo "==============="

cd backend

# Install test dependencies
print_status "Installing test dependencies..."
pip install -r requirements/test.txt > /dev/null 2>&1

# Run backend tests
print_status "Running backend tests..."
if pytest --cov=apps --cov-report=html --cov-report=term-missing -v; then
    print_status "Backend tests passed!"
else
    print_error "Backend tests failed!"
    exit 1
fi

cd ..

# Frontend Tests
echo -e "\n${YELLOW}Frontend Tests${NC}"
echo "================"

cd frontend

# Install dependencies
print_status "Installing frontend dependencies..."
npm ci > /dev/null 2>&1

# Run frontend tests
print_status "Running frontend tests..."
if npm run test:coverage; then
    print_status "Frontend tests passed!"
else
    print_error "Frontend tests failed!"
    exit 1
fi

cd ..

# Integration Tests (Optional)
if [ "$1" = "--integration" ]; then
    echo -e "\n${YELLOW}Integration Tests${NC}"
    echo "=================="
    
    print_status "Starting test services..."
    docker compose -f docker-compose.test.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Run migrations
    print_status "Running migrations..."
    docker compose -f docker-compose.test.yml exec -T django python manage.py migrate
    
    # Health checks
    print_status "Running health checks..."
    if curl -f http://localhost:8000/api/health/ > /dev/null 2>&1; then
        print_status "Backend health check passed!"
    else
        print_error "Backend health check failed!"
        docker compose -f docker-compose.test.yml down
        exit 1
    fi
    
    if curl -f http://localhost:5173/ > /dev/null 2>&1; then
        print_status "Frontend health check passed!"
    else
        print_error "Frontend health check failed!"
        docker compose -f docker-compose.test.yml down
        exit 1
    fi
    
    # Cleanup
    print_status "Cleaning up test services..."
    docker compose -f docker-compose.test.yml down
fi

echo -e "\n${GREEN}🎉 All tests passed!${NC}"
echo "Coverage reports:"
echo "  Backend: backend/htmlcov/index.html"
echo "  Frontend: frontend/coverage/index.html"