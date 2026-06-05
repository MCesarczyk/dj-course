#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY_HOST:-localhost}:${REGISTRY_PORT:-5000}"
SERVICE="${1:-wms-api}"
TAG="${2:-latest}"
IMAGE="$REGISTRY/$SERVICE:$TAG"

echo "==> Building $SERVICE..."
docker build -t "$IMAGE" "./$SERVICE"

echo "==> Pushing $IMAGE to registry..."
docker push "$IMAGE"

echo "==> Done. Image available at: $IMAGE"
echo "    Registry UI: http://localhost:${REGISTRY_UI_PORT:-8082}"
