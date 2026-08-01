#!/usr/bin/env bash
# Generate a node SDK per apitoolchain service from its OpenAPI, the canonical
# opensdk way: one CLI call over chain.json (sources → targets). The only extra
# is a monorepo tweak so the bun islands consume the packages as source.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. The opensdk CLI does all the work: process each source spec, generate each
#    node target into packages/apitoolchain-<name>-node.
node "$here/../xyd-opensdk-cli/dist/cli.js" run --chain "$here/chain.json"

# 2. Point each generated package at src/ (bun islands consume source, no build)
#    and ignore install + the .sdk regen manifest.
for dir in \
  apitoolchain-gitprovider-node \
  apitoolchain-registry-api-node \
  apitoolchain-api-node; do
  pkg="$here/../$dir/package.json"
  [ -f "$pkg" ] || continue
  node -e '
    const f = process.argv[1];
    const p = require(f);
    p.main = "./src/index.ts";
    p.types = "./src/index.ts";
    p.exports = { ".": { types: "./src/index.ts", import: "./src/index.ts" } };
    p.files = ["src"];
    p.scripts = { typecheck: "tsc --noEmit" };
    require("fs").writeFileSync(f, JSON.stringify(p, null, 2) + "\n");
  ' "$pkg"
  printf 'node_modules\n.sdk\n' >"$here/../$dir/.gitignore"
  echo "patched $dir → src exports"
done
