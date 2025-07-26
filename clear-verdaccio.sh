#!/bin/bash

# Default Verdaccio storage path
DEFAULT_STORAGE="$HOME/.local/share/verdaccio/storage"

# Fallback for older setups
FALLBACK_STORAGE="$HOME/.config/verdaccio/storage"

if [ -d "$DEFAULT_STORAGE" ]; then
  echo "Removing Verdaccio storage at: $DEFAULT_STORAGE"
  rm -rf "$DEFAULT_STORAGE"
elif [ -d "$FALLBACK_STORAGE" ]; then
  echo "Removing Verdaccio storage at: $FALLBACK_STORAGE"
  rm -rf "$FALLBACK_STORAGE"
else
  echo "No Verdaccio storage directory found at default locations."
fi

echo "Verdaccio storage reset complete."

echo "Login to local verdaccio (npm login --registry http://localhost:4873) via 'test' 'test'"
