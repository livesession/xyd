#!/usr/bin/env bash
# Generate a node SDK per apitoolchain service from its OpenAPI, the canonical
# opensdk way: one CLI call over chain.json (sources → targets). The only extra
# is a monorepo tweak so the bun islands consume the packages as source.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. The opensdk CLI does all the work: process each source spec, generate each
#    node target into packages/apitoolchain-<name>-node.
#
# This used to invoke `../xyd-opensdk-cli/dist/cli.js`, which stopped existing
# when the toolchain became Rust-only in the `opensdk` submodule — the script
# has been dead since. Resolve the binary instead, and FAIL rather than let a
# `set -e` script skip step 1 and silently "succeed" at step 2.
#
# `$here/../../opensdk` is deliberately repo-root-relative: it resolves the
# same before and after this package moves to the apitoolchain repo, because
# apitoolchain nests the same `opensdk` submodule at the same depth.
opensdk_bin="${OPENSDK_BIN:-}"
if [ -z "$opensdk_bin" ]; then
  for candidate in \
    "$here/../../opensdk/target/release/opensdk" \
    "$here/../../opensdk/target/debug/opensdk"; do
    [ -x "$candidate" ] && { opensdk_bin="$candidate"; break; }
  done
fi
[ -z "$opensdk_bin" ] && opensdk_bin="$(command -v opensdk || true)"
if [ -z "$opensdk_bin" ]; then
  echo "error: no opensdk binary found." >&2
  echo "  build it:   cargo build --manifest-path opensdk/Cargo.toml -p opensdk --bin opensdk --release" >&2
  echo "  or install: xyd components install opensdk" >&2
  echo "  or set:     OPENSDK_BIN=/path/to/opensdk" >&2
  exit 1
fi
echo "using opensdk: $opensdk_bin"
"$opensdk_bin" run --chain "$here/chain.json"

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
