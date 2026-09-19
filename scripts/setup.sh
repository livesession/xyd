#!/bin/bash
set -e

# Public submodules
git submodule update --init examples

# The two Rust-side submodules. NEITHER is optional: crates/ and
# packages/xyd-native path-depend on both, so without them cargo cannot load the
# workspace at all.
#
#   xwrite  — the content engine (frontmatter/highlight/math/mdx + the vendored
#             markdown/mdxjs forks).
#   opensdk — the SDK/CLI toolchain, including the shared spec loader
#             `oas_doc` that crates/xyd_openapi depends on.
git submodule update --init xwrite opensdk

# Private repo (not a submodule — requires access to xyd-js/.research)
if [ ! -d .research ]; then
  echo "Cloning .research (private repo)..."
  git clone git@github.com:xyd-js/.research.git || echo "⚠ Skipped .research (no access or SSH key)"
fi
