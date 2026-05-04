#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.e2e.yml"

cd "$ROOT_DIR"

# First positional arg or --filter value is the test filter
E2E_FILTER=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --filter) E2E_FILTER="$2"; shift 2 ;;
        *) E2E_FILTER="$1"; shift ;;
    esac
done

# Ensure packages are built (dist/ is copied into Docker image)
echo "Building packages..."
pnpm run build

echo "Running e2e tests in Docker..."
[ -n "$E2E_FILTER" ] && echo "Filter: $E2E_FILTER"

docker compose -f "$COMPOSE_FILE" down -v 2>/dev/null || true

E2E_FILTER="$E2E_FILTER" docker compose -f "$COMPOSE_FILE" up \
    --build --abort-on-container-exit --exit-code-from e2e
EXIT_CODE=$?

docker compose -f "$COMPOSE_FILE" down -v
exit $EXIT_CODE