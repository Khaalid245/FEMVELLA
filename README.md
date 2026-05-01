# Femvelle

Modest fashion e-commerce platform.

## Stack
- **Backend**: Django 5 + DRF + MySQL 8 + Redis + Celery
- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion
- **Infra**: Docker + Docker Compose

## Quick Start

```bash
# 1. Copy and fill env
cp backend/.env.example backend/.env

# 2. Start all services
docker compose up --build

# 3. Run migrations
docker compose exec django python manage.py migrate

# 4. Create superuser
docker compose exec django python manage.py createsuperuser
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/

## Development

```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd frontend && npm test

# Install pre-commit hooks
pip install pre-commit && pre-commit install
```

## Project Structure

```
femvelle/
├── backend/
│   ├── apps/          # accounts, products, orders, payments, blog, analytics
│   ├── config/        # settings (base, dev, prod, test), urls, celery
│   ├── core/          # shared models, permissions, pagination
│   └── requirements/  # base, dev, prod, test
├── frontend/
│   └── src/
│       ├── api/        # axios client + React Query hooks
│       ├── components/ # Button, Navbar, ProductCard, Layout
│       ├── pages/      # Home, Products, ProductDetail, Cart, Login, Register
│       └── store/      # Zustand (auth + cart)
├── docker-compose.yml
├── docker-compose.prod.yml
└── .github/workflows/
```
