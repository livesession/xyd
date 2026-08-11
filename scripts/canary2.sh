#!/bin/bash
set -e

# Publish a canary2 release of xyd-js from local machine
# Usage: ./scripts/canary2.sh
#
# Prerequisites:
#   - npm auth configured (npm login or NPM_TOKEN env var)
#   - packages built (pnpm run build)
#
# Install the canary2 release with:
#   bun add -g xyd-js@canary2

SHA=$(git rev-parse HEAD)
SHORT_SHA=${SHA::7}
CANARY2_VERSION="canary2-${SHORT_SHA}"

echo "🐤 Publishing canary2 release..."
echo "   Commit: ${SHORT_SHA}"
echo "   Version: 0.0.0-${CANARY2_VERSION}"
echo ""

# Step 1: Build packages
echo "🏗  Building packages..."
pnpm run build

# Step 2: Publish all @xyd-js/* packages with canary2 snapshot
echo "📦 Publishing @xyd-js/* packages..."
node ./release.js --prod --snapshot "${CANARY2_VERSION}"

# Step 3: Read the canary2 version of @xyd-js/cli from local package.json
# (already versioned by changeset in the previous step)
CANARY2_CLI_VERSION=$(node -p "require('./packages/xyd-cli/package.json').version")
echo "   @xyd-js/cli version: ${CANARY2_CLI_VERSION}"

# Step 4: Update xyd-js package and publish with canary2 tag
echo "📦 Publishing xyd-js canary2..."
cd packages/xyd-js

# Write dependency directly (avoids npm install resolving full dep tree)
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.dependencies['@xyd-js/cli'] = '${CANARY2_CLI_VERSION}';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 4) + '\n');
"

npm version "0.0.0-${CANARY2_VERSION}" --no-git-tag-version
npm publish --tag canary2
cd ../..

# Step 5: Restore xyd-js package.json
echo "🔄 Restoring packages/xyd-js/package.json..."
git checkout packages/xyd-js/package.json packages/xyd-js/package-lock.json 2>/dev/null || true

echo ""
echo "✅ Canary2 release published!"
echo ""
echo "Install with:"
echo "  bun add -g xyd-js@canary2"
echo "  npm i -g xyd-js@canary2"
echo "  pnpm add -g xyd-js@canary2"
