#!/usr/bin/env bash
set -euo pipefail
# Restore the oracle plaintext from the single encrypted archive (oracle.enc).
# Run before any test that reads the oracle (CI + local dev). Key from
# XYD_CONTENT_SECRET (env, else the gcloud secret of that name).
DIR="$(cd "$(dirname "$0")" && pwd)"

SECRET="${XYD_CONTENT_SECRET:-$(gcloud secrets versions access latest --secret=XYD_CONTENT_SECRET 2>/dev/null)}"
if [ -z "$SECRET" ]; then
  echo "error: XYD_CONTENT_SECRET not set and gcloud lookup failed" >&2
  exit 1
fi

if [ ! -f "$DIR/oracle.enc" ]; then
  echo "error: $DIR/oracle.enc not found" >&2
  exit 1
fi

openssl enc -aes-256-cbc -pbkdf2 -d -in "$DIR/oracle.enc" -pass "pass:$SECRET" | tar -xf - -C "$DIR"
echo "decrypted oracle.enc"
