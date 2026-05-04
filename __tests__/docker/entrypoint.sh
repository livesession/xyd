#!/usr/bin/env bash
set -euo pipefail

echo "=== Starting Verdaccio ==="
verdaccio --config /root/.config/verdaccio/config.yaml &
VERDACCIO_PID=$!

# Wait for Verdaccio to be ready
for i in $(seq 1 30); do
    if curl -sf http://localhost:4873 > /dev/null 2>&1; then
        echo "Verdaccio is ready"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "ERROR: Verdaccio failed to start"
        exit 1
    fi
    sleep 1
done

# Create Verdaccio user for publishing
npx npm-cli-login -u test -p test -e test@test.com -r http://localhost:4873 2>/dev/null || \
    curl -s -XPUT -H "Content-Type: application/json" \
        -d '{"name":"test","password":"test"}' \
        http://localhost:4873/-/user/org.couchdb.user:test > /dev/null

echo "=== Publishing packages to local registry ==="
export npm_config_registry=http://localhost:4873
export BUN_CONFIG_REGISTRY=http://localhost:4873

# Use release.js to version (without publishing yet)
SNAPSHOT_VERSION="docker-$(date +%s)"
node release.js --snapshot "$SNAPSHOT_VERSION" --no-publish

# Rebuild documan after versioning so it picks up new snapshot versions
# (documan bakes theme package versions at build time from their package.json)
echo "=== Rebuilding packages with snapshot versions ==="
pnpm run build

# Now publish all packages
echo "=== Publishing to Verdaccio ==="
pnpm changeset publish

echo "=== Publishing xyd-js CLI wrapper ==="
cd /app/packages/xyd-js

# Update @xyd-js/cli dependency to the snapshot version we just published
PUBLISHED_CLI_VERSION=$(npm view @xyd-js/cli version --registry http://localhost:4873 2>/dev/null || echo "")
if [ -z "$PUBLISHED_CLI_VERSION" ]; then
    echo "ERROR: @xyd-js/cli was not published to Verdaccio"
    exit 1
fi
echo "Published @xyd-js/cli version: $PUBLISHED_CLI_VERSION"

# Patch xyd-js package.json with the local version
node -e "
const pkg = require('./package.json');
pkg.version = '0.0.0-docker-test';
pkg.dependencies['@xyd-js/cli'] = '$PUBLISHED_CLI_VERSION';
delete pkg.publishConfig;
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 4));
"
npm publish --registry http://localhost:4873 --no-git-checks 2>/dev/null || true
cd /app

echo "=== Installing xyd-js globally from local registry ==="
npm install -g xyd-js@0.0.0-docker-test --registry http://localhost:4873

echo "=== Verifying xyd installation ==="
which xyd
xyd --help || true

echo "=== Running e2e tests ==="
# Use the globally installed xyd (not monorepo local)
export XYD_LOCAL_TEST_VERSION="0.0.0-docker-test"
# Ensure all package managers resolve from Verdaccio during tests
export npm_config_registry=http://localhost:4873
export BUN_CONFIG_REGISTRY=http://localhost:4873

# Forward any extra arguments (e.g., specific test paths)
exec pnpm run test:e2e "$@"