#!/usr/bin/env bash
set -euo pipefail

SECONDS=0
step_start() { STEP_START=$SECONDS; echo ""; echo "=== $1 ==="; }
step_done() { echo "--- $1 done in $((SECONDS - STEP_START))s (total: ${SECONDS}s)"; }

step_start "Starting Verdaccio"
verdaccio --config /root/.config/verdaccio/config.yaml &
VERDACCIO_PID=$!

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

# Create Verdaccio user and save auth token
TOKEN=$(curl -s -XPUT -H "Content-Type: application/json" \
    -d '{"name":"test","password":"test"}' \
    http://localhost:4873/-/user/org.couchdb.user:test | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).token)}catch{}})")

echo "//localhost:4873/:_authToken=\"${TOKEN}\"" > ~/.npmrc
echo "registry=http://localhost:4873" >> ~/.npmrc

export npm_config_registry=http://localhost:4873
export BUN_CONFIG_REGISTRY=http://localhost:4873
step_done "Starting Verdaccio"

step_start "Versioning packages"
SNAPSHOT_VERSION="docker-$(date +%s)"
node release.js --snapshot "$SNAPSHOT_VERSION" --no-publish
step_done "Versioning packages"

step_start "Rebuilding documan"
pnpm run --filter @xyd-js/documan build
step_done "Rebuilding documan"

step_start "Publishing to Verdaccio"
pnpm changeset publish
step_done "Publishing to Verdaccio"

step_start "Publishing xyd-js CLI wrapper"
cd /app/packages/xyd-js
PUBLISHED_CLI_VERSION=$(npm view @xyd-js/cli version --registry http://localhost:4873 2>/dev/null || echo "")
if [ -z "$PUBLISHED_CLI_VERSION" ]; then
    echo "ERROR: @xyd-js/cli was not published to Verdaccio"
    exit 1
fi
echo "Published @xyd-js/cli version: $PUBLISHED_CLI_VERSION"
node -e "
const pkg = require('./package.json');
pkg.version = '0.0.0-docker-test';
pkg.dependencies['@xyd-js/cli'] = '$PUBLISHED_CLI_VERSION';
delete pkg.publishConfig;
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 4));
"
npm publish --registry http://localhost:4873 --no-git-checks 2>/dev/null || true
cd /app
step_done "Publishing xyd-js CLI wrapper"

step_start "Installing xyd-js globally"
# Temporarily unset auth — read-only access doesn't need it,
# and sending it causes Verdaccio to run bcrypt on every request (~300ms each)
echo "registry=http://localhost:4873" > ~/.npmrc
bun install -g xyd-js@0.0.0-docker-test
step_done "Installing xyd-js globally"

# Restore auth token for any subsequent publishes
echo "//localhost:4873/:_authToken=\"${TOKEN}\"" > ~/.npmrc
echo "registry=http://localhost:4873" >> ~/.npmrc

step_start "Installing Playwright browsers"
npx playwright install chromium
step_done "Installing Playwright browsers"

echo ""
echo "=== Verifying xyd ==="
which xyd

step_start "Pre-installing xyd-js isolated"
# Pre-install to the exact path XydServer expects, so it skips its own install
INSTALL_DIR="/tmp/xyd-isolated-0.0.0-docker-test"
mkdir -p "$INSTALL_DIR"
echo '{"name":"xyd-isolated","private":true}' > "$INSTALL_DIR/package.json"
# No auth token — read-only, avoids Verdaccio bcrypt on every request
echo "registry=http://localhost:4873" > ~/.npmrc
cd "$INSTALL_DIR" && bun add xyd-js@0.0.0-docker-test && cd /app
touch "$INSTALL_DIR/.installed"
# Restore auth
echo "//localhost:4873/:_authToken=\"${TOKEN}\"" > ~/.npmrc
echo "registry=http://localhost:4873" >> ~/.npmrc
step_done "Pre-installing xyd-js isolated"

step_start "Running e2e tests"
export XYD_LOCAL_TEST_VERSION="0.0.0-docker-test"
pnpm run test:e2e -- --reporter=list "$@"
TEST_EXIT=$?
step_done "Running e2e tests"

echo ""
echo "========================================="
echo "  Total time: ${SECONDS}s"
echo "========================================="

exit $TEST_EXIT