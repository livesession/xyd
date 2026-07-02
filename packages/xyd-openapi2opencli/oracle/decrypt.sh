#!/usr/bin/env bash
set -euo pipefail
# Decrypt oracle .enc files using XYD_CONTENT_SECRET from gcloud.
# Run before tests that need the oracle data (CI + local dev).
DIR="$(cd "$(dirname "$0")" && pwd)"

SECRET="${XYD_CONTENT_SECRET:-$(gcloud secrets versions access latest --secret=XYD_CONTENT_SECRET 2>/dev/null)}"
if [ -z "$SECRET" ]; then
  echo "error: XYD_CONTENT_SECRET not set and gcloud lookup failed" >&2
  exit 1
fi

n=0
for enc in "$DIR"/*.enc; do
  [ -f "$enc" ] || continue
  plain="${enc%.enc}"
  openssl enc -aes-256-cbc -pbkdf2 -d -in "$enc" -out "$plain" -pass "pass:$SECRET"
  n=$((n + 1))
done
echo "decrypted $n oracle files"
