#!/bin/bash
set -e

# Publish a canary release of xyd-js from local machine
# Usage: ./scripts/canary.sh
#
# Prerequisites:
#   - npm auth configured (npm login or NPM_TOKEN env var)
#   - packages built (pnpm run build)
#
# Install the canary release with:
#   bun add -g xyd-js@canary

SHA=$(git rev-parse HEAD)
SHORT_SHA=${SHA::7}
CANARY_VERSION="canary-${SHORT_SHA}"

echo "🐤 Publishing canary release..."
echo "   Commit: ${SHORT_SHA}"
echo "   Version: 0.0.0-${CANARY_VERSION}"
echo ""

# Step 1: Build packages
echo "🏗  Building packages..."
pnpm run build

# Step 2: Publish all @xyd-js/* packages with canary snapshot
echo "📦 Publishing @xyd-js/* packages..."
node ./release.js --prod --snapshot "${CANARY_VERSION}"

# Step 3: Read the canary version of @xyd-js/cli from local package.json
# (already versioned by changeset in the previous step)
CANARY_CLI_VERSION=$(node -p "require('./packages/xyd-cli/package.json').version")
echo "   @xyd-js/cli version: ${CANARY_CLI_VERSION}"

# Step 4: Update xyd-js package and publish with canary tag
echo "📦 Publishing xyd-js canary..."
cd packages/xyd-js

# Write dependency directly (avoids npm install resolving full dep tree)
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.dependencies['@xyd-js/cli'] = '${CANARY_CLI_VERSION}';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 4) + '\n');
"

npm version "0.0.0-${CANARY_VERSION}" --no-git-tag-version
npm publish --tag canary
cd ../..

# Step 5: Restore xyd-js package.json
echo "🔄 Restoring packages/xyd-js/package.json..."
git checkout packages/xyd-js/package.json packages/xyd-js/package-lock.json 2>/dev/null || true

echo ""
echo "✅ Canary release published!"
echo ""
echo "Install with:"
echo "  bun add -g xyd-js@canary"
echo "  npm i -g xyd-js@canary"
echo "  pnpm add -g xyd-js@canary"