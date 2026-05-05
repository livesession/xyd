#!/usr/bin/env bash
set -euo pipefail

SECONDS=0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

BASE_IMAGE="xyd-e2e-base"
CONTAINER_NAME="xyd-e2e-run-$$"

# Build base image if it doesn't exist (or force with --rebuild-base)
if [[ "${1:-}" == "--rebuild-base" ]]; then
    shift
    echo "=== Rebuilding base image ==="
    docker build \
        -t "$BASE_IMAGE" \
        -f "$SCRIPT_DIR/Dockerfile" \
        "$PROJECT_ROOT"
    echo "--- Base image built in ${SECONDS}s"
elif ! docker image inspect "$BASE_IMAGE" &>/dev/null; then
    echo "=== Building base image (first time only) ==="
    docker build \
        -t "$BASE_IMAGE" \
        -f "$SCRIPT_DIR/Dockerfile" \
        "$PROJECT_ROOT"
    echo "--- Base image built in ${SECONDS}s"
fi

echo ""
echo "=== Building packages locally ==="
BUILD_START=$SECONDS
pnpm run build
echo "--- Local build done in $((SECONDS - BUILD_START))s (total: ${SECONDS}s)"

echo ""
echo "=== Running Docker container ==="
DOCKER_START=$SECONDS
docker run \
    --rm \
    --name "$CONTAINER_NAME" \
    -v "$PROJECT_ROOT:/app" \
    -v "$PROJECT_ROOT/playwright-report:/app/playwright-report" \
    -v "$PROJECT_ROOT/test-results:/app/test-results" \
    "$BASE_IMAGE" \
    "$@"
DOCKER_EXIT=$?

echo ""
echo "========================================="
echo "  Docker phase: $((SECONDS - DOCKER_START))s"
echo "  Total wall time: ${SECONDS}s"
echo "========================================="

exit $DOCKER_EXIT