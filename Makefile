# =============================================================================
# BHD Oman Marketplace - Development Makefile
# Convenient commands for development, testing, and deployment
# =============================================================================

.PHONY: help dev build test migrate seed deploy logs clean stop \
        install install-frontend install-backend \
        test-unit test-integration test-e2e test-coverage \
        lint lint-fix format \
        docker-build docker-push docker-up docker-down docker-logs \
        prod-up prod-down prod-logs prod-deploy \
        db-reset db-seed db-migrate db-rollback db-fresh \
        ssl-cert nginx-reload \
        backup restore \
        codegen docs analyze

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# Default target
.DEFAULT_GOAL := help

# =============================================================================
# HELP
# =============================================================================
help: ## Show this help message
	@echo "$(GREEN)BHD Oman Marketplace - Available Commands$(RESET)"
	@echo "=========================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(RESET) %s\n", $$1, $$2}'

# =============================================================================
# DEVELOPMENT
# =============================================================================
dev: ## Start development environment with hot reload
	@echo "$(GREEN)Starting development environment...$(RESET)"
	docker-compose -f docker-compose.dev.yml up --build -d
	@echo "$(GREEN)Development environment is running!$(RESET)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend API: http://localhost:3001"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis: localhost:6379"
	@echo "  Mailpit (email): http://localhost:8025"

dev-logs: ## View development logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

dev-restart: ## Restart development environment
	docker-compose -f docker-compose.dev.yml restart

# =============================================================================
# INSTALLATION
# =============================================================================
install: install-frontend install-backend ## Install all dependencies

install-frontend: ## Install frontend dependencies
	@echo "$(GREEN)Installing frontend dependencies...$(RESET)"
	cd frontend && npm ci

install-backend: ## Install backend dependencies
	@echo "$(GREEN)Installing backend dependencies...$(RESET)"
	cd backend && npm ci

# =============================================================================
# BUILD
# =============================================================================
build: ## Build all services for production
	@echo "$(GREEN)Building for production...$(RESET)"
	docker-compose -f docker-compose.prod.yml build --parallel

docker-build: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(RESET)"
	docker build -f Dockerfile.frontend -t bhd-frontend:latest .
	docker build -f Dockerfile.backend -t bhd-backend:latest .

docker-push: docker-build ## Build and push Docker images to registry
	@echo "$(GREEN)Pushing Docker images...$(RESET)"
	docker tag bhd-frontend:latest $(DOCKER_REGISTRY)/bhd-frontend:latest
	docker tag bhd-backend:latest $(DOCKER_REGISTRY)/bhd-backend:latest
	docker push $(DOCKER_REGISTRY)/bhd-frontend:latest
	docker push $(DOCKER_REGISTRY)/bhd-backend:latest

# =============================================================================
# TESTING
# =============================================================================
test: test-unit test-integration ## Run all tests (unit + integration)

test-unit: ## Run unit tests
	@echo "$(GREEN)Running unit tests...$(RESET)"
	cd backend && npm run test:unit -- --coverage --verbose
	cd frontend && npm run test:unit -- --coverage --verbose

test-integration: ## Run integration tests
	@echo "$(GREEN)Running integration tests...$(RESET)"
	cd backend && npm run test:integration -- --verbose

test-e2e: ## Run E2E tests with Playwright
	@echo "$(GREEN)Running E2E tests...$(RESET)"
	cd frontend && npx playwright test

test-e2e-ui: ## Run E2E tests with UI mode
	@echo "$(GREEN)Running E2E tests in UI mode...$(RESET)"
	cd frontend && npx playwright test --ui

test-coverage: ## Run all tests with coverage report
	@echo "$(GREEN)Running tests with coverage...$(RESET)"
	cd backend && npm run test:cov
	cd frontend && npm run test:cov

test-smoke: ## Run smoke tests only
	@echo "$(GREEN)Running smoke tests...$(RESET)"
	cd frontend && npx playwright test --project=smoke

# =============================================================================
# LINTING & FORMATTING
# =============================================================================
lint: ## Run ESLint on all code
	@echo "$(GREEN)Running ESLint...$(RESET)"
	cd backend && npm run lint
	cd frontend && npm run lint

lint-fix: ## Run ESLint and fix issues
	@echo "$(GREEN)Fixing lint issues...$(RESET)"
	cd backend && npm run lint -- --fix
	cd frontend && npm run lint -- --fix

format: ## Format code with Prettier
	@echo "$(GREEN)Formatting code...$(RESET)"
	cd backend && npx prettier --write "src/**/*.ts" "test/**/*.ts"
	cd frontend && npx prettier --write "src/**/*.{ts,tsx}" "app/**/*.{ts,tsx}" "e2e/**/*.ts"

format-check: ## Check code formatting
	@echo "$(GREEN)Checking code formatting...$(RESET)"
	cd backend && npx prettier --check "src/**/*.ts" "test/**/*.ts"
	cd frontend && npx prettier --check "src/**/*.{ts,tsx}" "app/**/*.{ts,tsx}"

# =============================================================================
# DATABASE
# =============================================================================
migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(RESET)"
	cd backend && npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts

db-migrate: migrate ## Alias for migrate

db-rollback: ## Rollback last database migration
	@echo "$(YELLOW)Rolling back last migration...$(RESET)"
	cd backend && npx typeorm-ts-node-commonjs migration:revert -d src/data-source.ts

db-reset: ## Reset database (drop all tables and re-run migrations)
	@echo "$(RED)Resetting database...$(RESET)"
	cd backend && npx typeorm-ts-node-commonjs schema:drop -d src/data-source.ts
	$(MAKE) migrate

db-fresh: db-reset seed ## Fresh database with seeds

db-seed: seed ## Alias for seed

seed: ## Seed database with initial data
	@echo "$(GREEN)Seeding database...$(RESET)"
	cd backend && npx ts-node src/database/seeds/main.seed.ts

db-studio: ## Open Prisma/TypeORM studio (if available)
	@echo "$(GREEN)Opening database studio...$(RESET)"
	@echo "Use pgAdmin or DBeaver to connect to PostgreSQL"

db-backup: ## Backup database
	@echo "$(GREEN)Creating database backup...$(RESET)"
	mkdir -p backups
	docker-compose exec -T db pg_dump -U bhd_user bhd_marketplace > backups/backup-$$(date +%Y%m%d-%H%M%S).sql

db-restore: ## Restore database from latest backup (prompts for confirmation)
	@echo "$(YELLOW)Restoring database from backup...$(RESET)"
	@read -p "Are you sure? This will overwrite existing data! [y/N] " confirm && \
		[ "$$confirm" = "y" ] && \
		LATEST=$$(ls -t backups/*.sql | head -1) && \
		docker-compose exec -T db psql -U bhd_user bhd_marketplace < $$LATEST && \
		echo "$(GREEN)Database restored!$(RESET)" || \
		echo "$(YELLOW)Restore cancelled.$(RESET)"

# =============================================================================
# PRODUCTION
# =============================================================================
prod-up: ## Start production environment
	@echo "$(GREEN)Starting production environment...$(RESET)"
	docker-compose -f docker-compose.prod.yml up -d --build
	@echo "$(GREEN)Production environment is running!$(RESET)"

prod-down: ## Stop production environment
	@echo "$(YELLOW)Stopping production environment...$(RESET)"
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## View production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-deploy: ## Deploy to production (full deployment)
	@echo "$(GREEN)Deploying to production...$(RESET)"
	./scripts/deploy.sh

prod-restart: ## Restart production services
	docker-compose -f docker-compose.prod.yml restart

# =============================================================================
# DOCKER UTILITIES
# =============================================================================
docker-up: ## Start base Docker environment
	docker-compose up -d

docker-down: ## Stop base Docker environment
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-clean: ## Clean Docker containers, images, and volumes
	@echo "$(YELLOW)Cleaning Docker resources...$(RESET)"
	docker-compose down -v --remove-orphans
	docker system prune -f --volumes

clean: docker-clean ## Alias for docker-clean

# =============================================================================
# SSL / HTTPS
# =============================================================================
ssl-cert: ## Generate SSL certificate with Certbot
	@echo "$(GREEN)Generating SSL certificate...$(RESET)"
	docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
		--webroot -w /var/www/html \
		-d bhdoman.com -d www.bhdoman.com \
		--agree-tos --non-interactive \
		-m admin@bhdoman.com
	$(MAKE) nginx-reload

ssl-renew: ## Renew SSL certificates
	@echo "$(GREEN)Renewing SSL certificates...$(RESET)"
	docker-compose -f docker-compose.prod.yml run --rm certbot renew
	$(MAKE) nginx-reload

nginx-reload: ## Reload Nginx configuration
	@echo "$(GREEN)Reloading Nginx...$(RESET)"
	docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

nginx-test: ## Test Nginx configuration
	@echo "$(GREEN)Testing Nginx configuration...$(RESET)"
	docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# =============================================================================
# LOGS
# =============================================================================
logs: ## View all service logs
	docker-compose -f docker-compose.prod.yml logs -f --tail=100

logs-backend: ## View backend logs
	docker-compose -f docker-compose.prod.yml logs -f app

logs-frontend: ## View frontend logs
	docker-compose -f docker-compose.prod.yml logs -f web

logs-nginx: ## View nginx logs
	docker-compose -f docker-compose.prod.yml logs -f nginx

logs-db: ## View database logs
	docker-compose -f docker-compose.prod.yml logs -f db

# =============================================================================
# MONITORING
# =============================================================================
monitor: ## Open monitoring dashboards
	@echo "$(GREEN)Monitoring URLs:$(RESET)"
	@echo "  Grafana: https://bhdoman.com/grafana"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Loki: http://localhost:3100"

status: ## Check service status
	@echo "$(GREEN)Service Status:$(RESET)"
	docker-compose -f docker-compose.prod.yml ps

health: ## Check health of all services
	@echo "$(GREEN)Checking service health...$(RESET)"
	@curl -sf http://localhost:3001/api/v1/health && echo "Backend: OK" || echo "Backend: FAILED"
	@curl -sf http://localhost:3000 && echo "Frontend: OK" || echo "Frontend: FAILED"
	@curl -sf http://localhost:9200/_cluster/health && echo "Elasticsearch: OK" || echo "Elasticsearch: FAILED"

# =============================================================================
# BACKUP & RESTORE
# =============================================================================
backup: ## Create full backup (database + uploads)
	@echo "$(GREEN)Creating full backup...$(RESET)"
	mkdir -p backups/$$(date +%Y%m%d)
	
	# Database backup
	docker-compose exec -T db pg_dump -U bhd_user bhd_marketplace | gzip > backups/$$(date +%Y%m%d)/db.sql.gz
	
	# Uploads backup
	tar -czf backups/$$(date +%Y%m%d)/uploads.tar.gz -C /var/lib/docker/volumes/bhd_marketplace_uploads/_data .
	
	@echo "$(GREEN)Backup completed: backups/$$(date +%Y%m%d)/$(RESET)"

restore: ## Restore from backup (prompts for date)
	@read -p "Enter backup date (YYYYMMDD): " date; \
	if [ -d "backups/$$date" ]; then \
		echo "$(GREEN)Restoring from backups/$$date...$(RESET)"; \
		gunzip < backups/$$date/db.sql.gz | docker-compose exec -T db psql -U bhd_user bhd_marketplace; \
		tar -xzf backups/$$date/uploads.tar.gz -C /var/lib/docker/volumes/bhd_marketplace_uploads/_data; \
		echo "$(GREEN)Restore completed!$(RESET)"; \
	else \
		echo "$(RED)Backup directory not found: backups/$$date$(RESET)"; \
	fi

# =============================================================================
# UTILITIES
# =============================================================================
stop: ## Stop all services
	docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
	docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
	docker-compose down 2>/dev/null || true

start: ## Start base services
	docker-compose up -d

destroy: ## Destroy everything (WARNING: data loss!)
	@echo "$(RED)WARNING: This will destroy all data!$(RESET)"
	@read -p "Type 'DESTROY' to confirm: " confirm && \
		[ "$$confirm" = "DESTROY" ] && \
		docker-compose -f docker-compose.prod.yml down -v --remove-orphans && \
		docker volume rm $$(docker volume ls -q | grep bhd) 2>/dev/null || true && \
		echo "$(GREEN)All data destroyed.$(RESET)" || \
		echo "$(YELLOW)Operation cancelled.$(RESET)"

codegen: ## Generate API client code from OpenAPI spec
	@echo "$(GREEN)Generating API client...$(RESET)"
	cd frontend && npx openapi-typescript http://localhost:3001/api/v1-json -o src/types/api.ts

docs: ## Generate documentation
	@echo "$(GREEN)Generating documentation...$(RESET)"
	cd backend && npx @compodoc/compodoc -p tsconfig.json -s

analyze: ## Analyze bundle size
	@echo "$(GREEN)Analyzing bundle size...$(RESET)"
	cd frontend && npm run analyze

# =============================================================================
# VERSION & INFO
# =============================================================================
version: ## Show project version
	@echo "BHD Marketplace v1.0.0"
	@echo "Node.js: $$(node --version)"
	@echo "npm: $$(npm --version)"
	@echo "Docker: $$(docker --version)"
	@echo "Docker Compose: $$(docker-compose --version)"

info: ## Show project information
	@echo "$(GREEN)BHD Oman Marketplace$(RESET)"
	@echo "====================="
	@echo "Repository: https://github.com/bhdoman/marketplace"
	@echo "Production URL: https://bhdoman.com"
	@echo "Staging URL: https://staging.bhdoman.com"
	@echo ""
	@echo "$(BLUE)Services:$(RESET)"
	@echo "  Frontend:     Next.js 14 (Port 3000)"
	@echo "  Backend:      NestJS 10 (Port 3001)"
	@echo "  Database:     PostgreSQL 16 (Port 5432)"
	@echo "  Cache:        Redis 7 (Port 6379)"
	@echo "  Search:       Elasticsearch 8 (Port 9200)"
	@echo "  Proxy:        Nginx 1.25 (Port 80/443)"
	@echo "  Monitoring:   Prometheus + Grafana"
	@echo ""
	@echo "$(BLUE)Environments:$(RESET)"
	@echo "  Development:  make dev"
	@echo "  Production:   make prod-up"
