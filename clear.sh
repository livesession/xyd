#!/bin/bash

# Cleanup pnpm
pnpm store prune

# Clear Nx cache
nx reset

# Define the directories to clean
root_directories=("node_modules" "pnpm-lock.yaml" "dist" "cli")
package_directories=("packages/*/node_modules" "packages/*/pnpm-lock.yaml" "packages/*/dist" "packages/*/.cli")

# Loop through each package directory and remove node_modules and pnpm-lock.yaml
for dir in "${package_directories[@]}"; do
  for subdir in $dir; do
    if [ -d "$subdir" ]; then
      echo "Removing $subdir"
      rm -rf "$subdir"
    fi
    if [ -f "$subdir" ]; then
      echo "Removing $subdir"
      rm "$subdir"
    fi
  done
done

# Remove the root node_modules, pnpm-lock.yaml, dist, and cli
for dir in "${root_directories[@]}"; do
  if [ -d "$dir" ]; then
    echo "Removing $dir"
    rm -rf "$dir"
  fi
  if [ -f "$dir" ]; then
    echo "Removing $dir"
    rm "$dir"
  fi
done

echo "Cleanup complete."