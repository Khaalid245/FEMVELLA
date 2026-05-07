@echo off
setlocal enabledelayedexpansion

echo 🧪 Running Femvelle Test Suite
echo ================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ✗ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Backend Tests
echo.
echo Backend Tests
echo =============

cd backend

echo ✓ Installing test dependencies...
pip install -r requirements/test.txt >nul 2>&1

echo ✓ Running backend tests...
pytest --cov=apps --cov-report=html --cov-report=term-missing -v
if errorlevel 1 (
    echo ✗ Backend tests failed!
    exit /b 1
)
echo ✓ Backend tests passed!

cd ..

REM Frontend Tests
echo.
echo Frontend Tests
echo ==============

cd frontend

echo ✓ Installing frontend dependencies...
npm ci >nul 2>&1

echo ✓ Running frontend tests...
npm run test:coverage
if errorlevel 1 (
    echo ✗ Frontend tests failed!
    exit /b 1
)
echo ✓ Frontend tests passed!

cd ..

REM Integration Tests (if --integration flag is passed)
if "%1"=="--integration" (
    echo.
    echo Integration Tests
    echo =================
    
    echo ✓ Starting test services...
    docker compose -f docker-compose.test.yml up -d
    
    echo ✓ Waiting for services to be ready...
    timeout /t 30 /nobreak >nul
    
    echo ✓ Running migrations...
    docker compose -f docker-compose.test.yml exec -T django python manage.py migrate
    
    echo ✓ Running health checks...
    curl -f http://localhost:8000/api/health/ >nul 2>&1
    if errorlevel 1 (
        echo ✗ Backend health check failed!
        docker compose -f docker-compose.test.yml down
        exit /b 1
    )
    
    curl -f http://localhost:5173/ >nul 2>&1
    if errorlevel 1 (
        echo ✗ Frontend health check failed!
        docker compose -f docker-compose.test.yml down
        exit /b 1
    )
    
    echo ✓ Cleaning up test services...
    docker compose -f docker-compose.test.yml down
)

echo.
echo 🎉 All tests passed!
echo Coverage reports:
echo   Backend: backend\htmlcov\index.html
echo   Frontend: frontend\coverage\index.html