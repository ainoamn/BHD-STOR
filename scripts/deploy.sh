#!/bin/bash
# =============================================================================
# BHD Oman Marketplace - Production Deployment Script
# Handles: code pull, Docker build, migrations, health check, rollback
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="bhd-marketplace"
COMPOSE_FILE="docker-compose.prod.yml"
DEPLOY_DIR="/opt/${PROJECT_NAME}"
BACKUP_DIR="${DEPLOY_DIR}/backups"
LOG_FILE="${DEPLOY_DIR}/logs/deploy-$(date +%Y%m%d-%H%M%S).log"
MAX_BACKUPS=10
HEALTH_CHECK_TIMEOUT=120
ROLLBACK_TAG="rollback"

# Slack/Discord webhook (optional)
NOTIFICATION_WEBHOOK="${NOTIFICATION_WEBHOOK:-}"

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        INFO)  echo -e "${GREEN}[INFO]${NC}  ${timestamp} - ${message}" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC}  ${timestamp} - ${message}" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} ${timestamp} - ${message}" ;;
        DEBUG) echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - ${message}" ;;
    esac
    
    # Also log to file
    echo "[${level}] ${timestamp} - ${message}" >> "$LOG_FILE" 2>/dev/null || true
}

notify() {
    local message="$1"
    
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"${message}\"}" \
            "$NOTIFICATION_WEBHOOK" > /dev/null 2>&1 || true
    fi
}

rollback() {
    log ERROR "Deployment failed! Initiating rollback..."
    
    # Tag current images as failed
    docker tag ${DOCKER_REGISTRY:-bhdoman}/bhd-backend:latest ${DOCKER_REGISTRY:-bhdoman}/bhd-backend:failed-$(date +%Y%m%d) 2>/dev/null || true
    docker tag ${DOCKER_REGISTRY:-bhdoman}/bhd-frontend:latest ${DOCKER_REGISTRY:-bhdoman}/bhd-frontend:failed-$(date +%Y%m%d) 2>/dev/null || true
    
    # Check if rollback images exist
    if docker image inspect ${DOCKER_REGISTRY:-bhdoman}/bhd-backend:${ROLLBACK_TAG} > /dev/null 2>&1; then
        log INFO "Rolling back to previous version..."
        
        # Restore rollback images
        docker tag ${DOCKER_REGISTRY:-bhdoman}/bhd-backend:${ROLLBACK_TAG} ${DOCKER_REGISTRY:-bhdoman}/bhd-backend:latest
        docker tag ${DOCKER_REGISTRY:-bhdoman}/bhd-frontend:${ROLLBACK_TAG} ${DOCKER_REGISTRY:-bhdoman}/bhd-frontend:latest
        
        # Restart services
        docker-compose -f "$COMPOSE_FILE" up -d app web --no-deps
        
        log INFO "Rollback completed."
        notify "Deployment failed and was rolled back. Check logs: ${LOG_FILE}"
    else
        log WARN "No rollback images found. Manual intervention required."
        notify "Deployment failed! No rollback images available. Manual intervention required!"
    fi
    
    exit 1
}

health_check() {
    local url="$1"
    local service="$2"
    local timeout="${3:-$HEALTH_CHECK_TIMEOUT}"
    local start_time=$(date +%s)
    
    log INFO "Health checking ${service} at ${url}..."
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $timeout ]; then
            log ERROR "Health check for ${service} timed out after ${timeout}s"
            return 1
        fi
        
        if curl -sf "${url}" > /dev/null 2>&1; then
            log INFO "${service} is healthy! (${elapsed}s)"
            return 0
        fi
        
        echo -n "."
        sleep 2
    done
}

# Trap errors for rollback
trap 'rollback' ERR

# =============================================================================
# MAIN DEPLOYMENT
# =============================================================================

main() {
    log INFO "=========================================="
    log INFO "BHD Marketplace Deployment Started"
    log INFO "=========================================="
    
    # Create necessary directories
    mkdir -p "${BACKUP_DIR}" "${DEPLOY_DIR}/logs"
    
    # Check prerequisites
    log INFO "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log ERROR "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log ERROR "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "$COMPOSE_FILE" ]; then
        log INFO "Changing to deployment directory..."
        cd "$DEPLOY_DIR" || {
            log ERROR "Cannot access deployment directory: ${DEPLOY_DIR}"
            exit 1
        }
    fi
    
    # =================================================================
    # STEP 1: Pull latest code
    # =================================================================
    log INFO "[Step 1/8] Pulling latest code..."
    
    if [ -d ".git" ]; then
        git fetch origin
        git checkout main
        git pull origin main
        VERSION=$(git describe --tags --always 2>/dev/null || echo "$(date +%Y%m%d)-$(git rev-parse --short HEAD)")
    else
        VERSION=$(date +%Y%m%d-%H%M%S)
    fi
    
    log INFO "Deploying version: ${VERSION}"
    
    # =================================================================
    # STEP 2: Create backup
    # =================================================================
    log INFO "[Step 2/8] Creating backup..."
    
    # Backup database
    BACKUP_FILE="${BACKUP_DIR}/pre-deploy-$(date +%Y%m%d-%H%M%S).sql.gz"
    if docker-compose -f "$COMPOSE_FILE" ps db | grep -q "Up"; then
        docker-compose -f "$COMPOSE_FILE" exec -T db pg_dump \
            -U "${DB_USER:-bhd_user}" \
            "${DB_NAME:-bhd_marketplace}" | gzip > "$BACKUP_FILE"
        log INFO "Database backup created: ${BACKUP_FILE}"
    else
        log WARN "Database container not running, skipping DB backup"
    fi
    
    # Tag current images for rollback
    if docker image inspect ${DOCKER_REGISTRY:-bhdoman}/bhd-backend:latest > /dev/null 2>&1; then
        docker tag ${DOCKER_REGISTRY:-bhdoman}/bhd-backend:latest ${DOCKER_REGISTRY:-bhdoman}/bhd-backend:${ROLLBACK_TAG}
        docker tag ${DOCKER_REGISTRY:-bhdoman}/bhd-frontend:latest ${DOCKER_REGISTRY:-bhdoman}/bhd-frontend:${ROLLBACK_TAG}
        log INFO "Current images tagged for rollback"
    fi
    
    # Cleanup old backups
    ls -t "${BACKUP_DIR}"/pre-deploy-*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
    
    # =================================================================
    # STEP 3: Build and pull images
    # =================================================================
    log INFO "[Step 3/8] Building and pulling images..."
    
    # Update image tags in compose if version is specified
    if [ -n "${VERSION:-}" ]; then
        export BACKEND_TAG="${VERSION}"
        export FRONTEND_TAG="${VERSION}"
    fi
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build images
    docker-compose -f "$COMPOSE_FILE" build --parallel
    
    # =================================================================
    # STEP 4: Run database migrations
    # =================================================================
    log INFO "[Step 4/8] Running database migrations..."
    
    # Ensure DB is running
    docker-compose -f "$COMPOSE_FILE" up -d db
    
    # Wait for DB to be ready
    sleep 5
    
    # Run migrations
    docker-compose -f "$COMPOSE_FILE" run --rm app \
        npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts \
        || {
        log ERROR "Migration failed!"
        # If migration fails, try to show pending migrations
        docker-compose -f "$COMPOSE_FILE" run --rm app \
            npx typeorm-ts-node-commonjs migration:show -d src/data-source.ts || true
        rollback
    }
    
    log INFO "Migrations completed successfully"
    
    # =================================================================
    # STEP 5: Deploy services (zero-downtime)
    # =================================================================
    log INFO "[Step 5/8] Deploying services..."
    
    # Update app service with zero-downtime (scale to 2, then back to 1)
    docker-compose -f "$COMPOSE_FILE" up -d --no-deps --scale app=2 app
    log INFO "Scaled app to 2 instances for zero-downtime"
    
    sleep 15
    
    # Scale back to 1 (new container takes over)
    docker-compose -f "$COMPOSE_FILE" up -d --no-deps --scale app=1 app
    
    # Update web service similarly
    docker-compose -f "$COMPOSE_FILE" up -d --no-deps --scale web=2 web
    sleep 10
    docker-compose -f "$COMPOSE_FILE" up -d --no-deps --scale web=1 web
    
    # Update remaining services
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans
    
    log INFO "Services deployed"
    
    # =================================================================
    # STEP 6: Health checks
    # =================================================================
    log INFO "[Step 6/8] Running health checks..."
    
    # Backend health check
    if ! health_check "http://localhost:3001/api/v1/health" "Backend" 60; then
        log ERROR "Backend health check failed!"
        rollback
    fi
    
    # Frontend health check
    if ! health_check "http://localhost:3000" "Frontend" 60; then
        log ERROR "Frontend health check failed!"
        rollback
    fi
    
    # API endpoints health check
    log INFO "Checking API endpoints..."
    
    # Products endpoint
    if ! curl -sf "http://localhost:3001/api/v1/products" > /dev/null 2>&1; then
        log WARN "Products endpoint check failed"
    fi
    
    # Categories endpoint
    if ! curl -sf "http://localhost:3001/api/v1/categories" > /dev/null 2>&1; then
        log WARN "Categories endpoint check failed"
    fi
    
    log INFO "All health checks passed!"
    
    # =================================================================
    # STEP 7: Cleanup
    # =================================================================
    log INFO "[Step 7/8] Cleaning up..."
    
    # Remove old images
    docker image prune -af --filter "until=168h" --filter "label!=${ROLLBACK_TAG}" > /dev/null 2>&1 || true
    
    # Clean up exited containers
    docker container prune -f > /dev/null 2>&1 || true
    
    # Clean up unused volumes
    docker volume prune -f > /dev/null 2>&1 || true
    
    log INFO "Cleanup completed"
    
    # =================================================================
    # STEP 8: Verification
    # =================================================================
    log INFO "[Step 8/8] Running final verification..."
    
    # Check all services are running
    log INFO "Service status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    # External health check (if domain is configured)
    if [ -n "${DOMAIN:-}" ]; then
        log INFO "Checking external health..."
        if curl -sf "https://${DOMAIN}/api/v1/health" > /dev/null 2>&1; then
            log INFO "External health check passed!"
        else
            log WARN "External health check failed (might be DNS/proxy related)"
        fi
    fi
    
    # =================================================================
    # DEPLOYMENT COMPLETE
    # =================================================================
    log INFO "=========================================="
    log INFO "Deployment Completed Successfully!"
    log INFO "=========================================="
    log INFO "Version: ${VERSION}"
    log INFO "Log file: ${LOG_FILE}"
    
    notify "Deployment successful! Version: ${VERSION}"
    
    return 0
}

# =============================================================================
# CLI COMMANDS
# =============================================================================

case "${1:-deploy}" in
    deploy)
        main "$@"
        ;;
    
    rollback)
        log WARN "Manual rollback requested..."
        DOCKER_REGISTRY="${DOCKER_REGISTRY:-bhdoman}"
        if docker image inspect ${DOCKER_REGISTRY}/bhd-backend:rollback > /dev/null 2>&1; then
            docker tag ${DOCKER_REGISTRY}/bhd-backend:rollback ${DOCKER_REGISTRY}/bhd-backend:latest
            docker tag ${DOCKER_REGISTRY}/bhd-frontend:rollback ${DOCKER_REGISTRY}/bhd-frontend:latest
            docker-compose -f "$COMPOSE_FILE" up -d app web --no-deps
            log INFO "Rollback completed!"
        else
            log ERROR "No rollback images found!"
            exit 1
        fi
        ;;
    
    status)
        docker-compose -f "$COMPOSE_FILE" ps
        ;;
    
    logs)
        docker-compose -f "$COMPOSE_FILE" logs -f --tail=100
        ;;
    
    migrate)
        docker-compose -f "$COMPOSE_FILE" run --rm app \
            npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
        ;;
    
    backup)
        mkdir -p "${BACKUP_DIR}"
        docker-compose -f "$COMPOSE_FILE" exec -T db pg_dump \
            -U "${DB_USER:-bhd_user}" \
            "${DB_NAME:-bhd_marketplace}" | gzip > "${BACKUP_DIR}/manual-$(date +%Y%m%d-%H%M%S).sql.gz"
        log INFO "Backup created!"
        ;;
    
    health)
        echo "Backend: $(curl -sf http://localhost:3001/api/v1/health && echo 'OK' || echo 'FAIL')"
        echo "Frontend: $(curl -sf http://localhost:3000 > /dev/null && echo 'OK' || echo 'FAIL')"
        echo "Database: $(docker-compose -f "$COMPOSE_FILE" exec -T db pg_isready -U "${DB_USER:-bhd_user}" > /dev/null 2>&1 && echo 'OK' || echo 'FAIL')"
        echo "Redis: $(docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1 && echo 'OK' || echo 'FAIL')"
        ;;
    
    *)
        echo "Usage: $0 {deploy|rollback|status|logs|migrate|backup|health}"
        exit 1
        ;;
esac
