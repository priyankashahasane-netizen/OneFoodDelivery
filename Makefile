.PHONY: help install build test lint docker-build docker-up docker-down migrate-backup

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies for all apps
	cd apps/backend && npm install
	cd apps/tracking-web && npm install
	cd apps/admin-dashboard && npm install

build: ## Build all applications
	cd apps/backend && npm run build
	cd apps/tracking-web && npm run build
	cd apps/admin-dashboard && npm run build

test: ## Run tests
	cd apps/backend && npm test || true

lint: ## Lint all applications
	cd apps/backend && npm run lint
	cd apps/tracking-web && npm run lint
	cd apps/admin-dashboard && npm run lint

docker-build: ## Build Docker images
	docker-compose build

docker-up: ## Start all services with Docker Compose
	docker-compose up -d

docker-down: ## Stop all services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

migrate: ## Run database migrations
	cd apps/backend && npm run migration:run

backup: ## Backup database
	bash scripts/backup-db.sh


