#!/bin/bash

# Fetch remote tags
git fetch --tags

# Get local tags
local_tags=$(git tag)

# Get remote tags
remote_tags=$(git ls-remote --tags origin | awk '{print $2}' | sed 's|refs/tags/||' | sed 's/\^{}//')

# Find local tags not on remote
for tag in $local_tags; do
  if ! echo "$remote_tags" | grep -qx "$tag"; then
    echo "Deleting local tag: $tag"
    git tag -d "$tag"
  fi
done
