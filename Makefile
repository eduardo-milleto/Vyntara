# Makefile for Vyntara Project

.PHONY: help install dev build test lint format clean docker up down logs

help:
	@echo "🚀 Vyntara - Professional Commands"
	@echo ""
	@echo "Installation & Setup:"
	@echo "  make install          Install all dependencies"
	@echo "  make setup            Setup project (install + hooks)"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start dev environment with hot reload"
	@echo "  make dev-backend      Start only backend"
	@echo "  make dev-frontend     Start only frontend"
	@echo ""
	@echo "Building:"
	@echo "  make build            Build all packages"
	@echo "  make build-backend    Build backend only"
	@echo "  make build-frontend   Build frontend only"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test             Run all tests"
	@echo "  make test-coverage    Run tests with coverage report"
	@echo "  make lint             Check linting"
	@echo "  make lint-fix         Fix linting issues"
	@echo "  make format           Format code with prettier"
	@echo "  make format-check     Check if code needs formatting"
	@echo "  make type-check       Run TypeScript type checking"
	@echo ""
	@echo "Security:"
	@echo "  make audit            Check npm vulnerabilities"
	@echo "  make audit-fix        Fix npm vulnerabilities"
	@echo "  make secrets          Detect secrets in code"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build     Build Docker images"
	@echo "  make docker-up        Start Docker containers"
	@echo "  make docker-down      Stop Docker containers"
	@echo "  make docker-logs      View Docker logs"
	@echo "  make docker-clean     Remove Docker containers & images"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean            Clean all build artifacts"
	@echo "  make clean-deps       Reinstall all dependencies"

# Installation targets
install:
	@echo "📦 Installing dependencies..."
	npm run install:all

setup: install
	@echo "🔧 Setting up Git hooks..."
	npx husky install
	@echo "✅ Setup complete!"

# Development targets
dev:
	@echo "🚀 Starting development environment..."
	npm run dev

dev-backend:
	@echo "🚀 Starting backend..."
	npm run dev --prefix backend

dev-frontend:
	@echo "🚀 Starting frontend..."
	npm run dev --prefix frontend/vyntara

# Build targets
build:
	@echo "🏗️  Building all packages..."
	npm run build:all

build-backend:
	@echo "🏗️  Building backend..."
	npm run build --prefix backend

build-frontend:
	@echo "🏗️  Building frontend..."
	npm run build --prefix frontend/vyntara

# Test targets
test:
	@echo "🧪 Running tests..."
	npm run test

test-coverage:
	@echo "🧪 Running tests with coverage..."
	npm run test -- --coverage
	@echo "📊 Coverage report generated in coverage/"

test-watch:
	@echo "🧪 Running tests in watch mode..."
	npm run test -- --watch

# Lint & Format targets
lint:
	@echo "🔍 Checking code quality..."
	npm run lint

lint-fix:
	@echo "🔧 Fixing linting issues..."
	npm run lint:fix

format:
	@echo "✨ Formatting code..."
	npm run format

format-check:
	@echo "✨ Checking code formatting..."
	npm run format:check

type-check:
	@echo "📝 Checking TypeScript types..."
	npm run type-check

# Security targets
audit:
	@echo "🔐 Checking npm vulnerabilities..."
	npm audit

audit-fix:
	@echo "🔐 Fixing npm vulnerabilities..."
	npm audit fix

secrets:
	@echo "🔐 Detecting secrets..."
	detect-secrets scan --baseline .secrets.baseline

# Docker targets
docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build

docker-up:
	@echo "🐳 Starting Docker containers..."
	docker-compose up -d
	@echo "✅ Containers started"
	@echo "Backend:  http://localhost:3000"
	@echo "Frontend: http://localhost:80"

docker-down:
	@echo "🐳 Stopping Docker containers..."
	docker-compose down

docker-logs:
	@echo "🐳 Showing Docker logs..."
	docker-compose logs -f

docker-clean:
	@echo "🐳 Cleaning Docker resources..."
	docker-compose down -v
	docker system prune -f

# Maintenance targets
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist build coverage .next out
	rm -rf frontend/*/dist frontend/*/build
	npm run clean

clean-deps:
	@echo "🧹 Cleaning dependencies..."
	npm run clean

# Quality gate
quality-check: lint test build
	@echo "✅ All quality checks passed!"

# Release targets
release-major:
	@echo "📦 Creating major release..."
	npm version major
	git push origin main --tags

release-minor:
	@echo "📦 Creating minor release..."
	npm version minor
	git push origin main --tags

release-patch:
	@echo "📦 Creating patch release..."
	npm version patch
	git push origin main --tags

# Development convenience targets
.DEFAULT_GOAL := help
