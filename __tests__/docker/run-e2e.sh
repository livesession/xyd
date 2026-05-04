#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

IMAGE_NAME="xyd-e2e-tests"
CONTAINER_NAME="xyd-e2e-run-$$"

echo "Building Docker image..."
docker build \
    -t "$IMAGE_NAME" \
    -f "$SCRIPT_DIR/Dockerfile" \
    "$PROJECT_ROOT"

echo "Running e2e tests in Docker..."
docker run \
    --rm \
    --name "$CONTAINER_NAME" \
    -v "$PROJECT_ROOT/playwright-report:/app/playwright-report" \
    -v "$PROJECT_ROOT/test-results:/app/test-results" \
    "$IMAGE_NAME" \
    "$@"