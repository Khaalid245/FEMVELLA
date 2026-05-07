# Testing Documentation

## Overview
Comprehensive test suite ensuring production reliability across all system components.

## Test Structure

### Backend Tests (`/backend/tests/`)
- **Inventory Tests**: Atomic operations, race conditions, stock management
- **API Tests**: Products, orders, authentication endpoints
- **Payment Tests**: Stripe webhooks, payment processing
- **Service Tests**: Email, shipping, reviews business logic

### Frontend Tests (`/frontend/src/test/`)
- **Component Tests**: UI components with React Testing Library
- **Page Tests**: Checkout flow, admin interface
- **Hook Tests**: Custom hooks and API integration
- **Utils**: Test utilities and mocks

## Running Tests

### Backend
```bash
cd backend
pytest --cov=apps --cov-report=html --cov-report=term-missing
```

### Frontend
```bash
cd frontend
npm run test:coverage
```

### Full Suite
```bash
./run-tests.sh --integration
```

## Coverage Requirements
- Minimum 80% code coverage
- Critical paths: 95%+ coverage
- Payment flows: 100% coverage

## Test Categories

### Unit Tests
- Individual functions and methods
- Business logic validation
- Data transformations

### Integration Tests
- API endpoint testing
- Database operations
- Service interactions

### E2E Tests
- Complete user workflows
- Payment processing
- Admin operations

## Mock Strategy
- External APIs (Stripe, email)
- File system operations
- Time-dependent functions
- Network requests

## CI/CD Integration
- GitHub Actions workflow
- Automated on push/PR
- Coverage reporting
- Test result notifications

## Performance Testing
- Load testing for critical endpoints
- Database query optimization
- Memory usage monitoring
- Response time validation