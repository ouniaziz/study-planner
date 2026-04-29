#!/usr/bin/env bash
###############################################################
# deploy.sh  –  EC2 deployment / update script
#
# Run this directly on the EC2 instance, OR call it from the
# GitHub Actions SSH step.  It is idempotent – safe to re-run.
#
# Usage:
#   ./deploy.sh [IMAGE_TAG]
#
#   IMAGE_TAG defaults to "latest" when omitted.
###############################################################
set -euo pipefail

# ── Config (override via env vars or edit here) ──────────────
APP_DIR="/opt/studyplanner"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
ENV_FILE="${APP_DIR}/.env.production"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?ERROR: AWS_ACCOUNT_ID env var is required}"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_BACKEND="${ECR_BACKEND:-${ECR_REGISTRY}/studyplanner-backend}"
ECR_FRONTEND="${ECR_FRONTEND:-${ECR_REGISTRY}/studyplanner-frontend}"
IMAGE_TAG="${1:-${IMAGE_TAG:-latest}}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

###############################################################
# 1. Validate prerequisites
###############################################################
log "==> Checking prerequisites..."
command -v docker  >/dev/null || { log "ERROR: docker not found"; exit 1; }
docker compose version >/dev/null || { log "ERROR: docker compose plugin not found"; exit 1; }
[[ -f "$COMPOSE_FILE" ]] || { log "ERROR: $COMPOSE_FILE not found"; exit 1; }
[[ -f "$ENV_FILE"     ]] || { log "ERROR: $ENV_FILE not found – copy .env.production.example"; exit 1; }

###############################################################
# 2. ECR Login
###############################################################
log "==> Logging into ECR ($ECR_REGISTRY)..."
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"

###############################################################
# 3. Pull latest images
###############################################################
log "==> Pulling backend image  : ${ECR_BACKEND}:${IMAGE_TAG}"
docker pull "${ECR_BACKEND}:${IMAGE_TAG}"

log "==> Pulling frontend image : ${ECR_FRONTEND}:${IMAGE_TAG}"
docker pull "${ECR_FRONTEND}:${IMAGE_TAG}"

# Re-tag as :latest so compose always gets the right image
docker tag "${ECR_BACKEND}:${IMAGE_TAG}"  "${ECR_BACKEND}:latest"
docker tag "${ECR_FRONTEND}:${IMAGE_TAG}" "${ECR_FRONTEND}:latest"

###############################################################
# 4. Deploy / update with Docker Compose
###############################################################
log "==> Starting containers (IMAGE_TAG=${IMAGE_TAG})..."
cd "$APP_DIR"

export ECR_BACKEND ECR_FRONTEND IMAGE_TAG

# --env-file loads .env.production; --remove-orphans cleans stale containers
docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  up -d --remove-orphans

###############################################################
# 5. Health check – wait up to 60 s for backend to be ready
###############################################################
log "==> Waiting for backend health check..."
ATTEMPTS=0
until curl -sf http://localhost:8080/actuator/health >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [[ $ATTEMPTS -ge 12 ]]; then
    log "WARNING: Backend did not become healthy within 60 s – check logs:"
    docker compose -f "$COMPOSE_FILE" logs --tail=40 backend
    break
  fi
  log "   ... attempt $ATTEMPTS / 12 – sleeping 5 s"
  sleep 5
done

###############################################################
# 6. Cleanup unused images (keeps disk tidy)
###############################################################
log "==> Pruning unused images..."
docker image prune -f

###############################################################
# 7. Status summary
###############################################################
log "==> Deployment complete. Running containers:"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
