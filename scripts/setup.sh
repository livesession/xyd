#!/bin/bash
set -e

# Public submodules
git submodule update --init examples

# The three Rust-side submodules. NONE is optional: crates/ and
# packages/xyd-native path-depend on all of them, so without them cargo cannot
# load the workspace at all.
#
#   xwrite       — the content engine (frontmatter/highlight/math/mdx + the
#                  vendored markdown/mdxjs forks).
#   opensdk      — the SDK/CLI toolchain.
#   apitoolchain — the API converters (uniform/openapi/gql/mcp/opencli) and
#                  their five npm shims, which are pnpm workspace members here.
#                  It takes oas_doc as a pinned GIT dep rather than nesting
#                  opensdk, so no --recursive is needed (and two path-deps on
#                  oas_doc would make cargo refuse to write a lockfile).

git submodule update --init apitoolchain

# Private repo (not a submodule — requires access to xyd-js/.research)
if [ ! -d .research ]; then
  echo "Cloning .research (private repo)..."
  git clone git@github.com:xyd-js/.research.git || echo "⚠ Skipped .research (no access or SSH key)"
fi
