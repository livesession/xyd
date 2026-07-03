#!/usr/bin/env bash
set -euo pipefail
# Restore the .research plaintext from the single encrypted archive (research.enc).
# Mirrors oracle/decrypt.sh. Key from XYD_CONTENT_SECRET (env, else the gcloud
# secret of that name).
DIR="$(cd "$(dirname "$0")" && pwd)"

SECRET="${XYD_CONTENT_SECRET:-$(gcloud secrets versions access latest --secret=XYD_CONTENT_SECRET 2>/dev/null)}"
if [ -z "$SECRET" ]; then
  echo "error: XYD_CONTENT_SECRET not set and gcloud lookup failed" >&2
  exit 1
fi

if [ ! -f "$DIR/research.enc" ]; then
  echo "error: $DIR/research.enc not found" >&2
  exit 1
fi

openssl enc -aes-256-cbc -pbkdf2 -d -in "$DIR/research.enc" -pass "pass:$SECRET" | tar -xf - -C "$DIR"
echo "decrypted research.enc"
