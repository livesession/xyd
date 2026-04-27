#!/bin/bash
set -e

# Public submodule
git submodule update --init examples

# Private repo (not a submodule — requires access to xyd-js/.research)
if [ ! -d .research ]; then
  echo "Cloning .research (private repo)..."
  git clone git@github.com:xyd-js/.research.git || echo "⚠ Skipped .research (no access or SSH key)"
fi
