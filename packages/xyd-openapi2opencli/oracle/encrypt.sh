#!/usr/bin/env bash
set -euo pipefail
# Encrypt oracle plaintext files using XYD_CONTENT_SECRET from gcloud.
# Produces *.enc siblings; only the .enc files are committed.
DIR="$(cd "$(dirname "$0")" && pwd)"

SECRET="${XYD_CONTENT_SECRET:-$(gcloud secrets versions access latest --secret=XYD_CONTENT_SECRET 2>/dev/null)}"
if [ -z "$SECRET" ]; then
  echo "error: XYD_CONTENT_SECRET not set and gcloud lookup failed" >&2
  exit 1
fi

n=0
for src in "$DIR"/*; do
  [ -f "$src" ] || continue
  base="$(basename "$src")"
  # skip scripts, README, already-encrypted, and generated reports
  case "$base" in
    encrypt.sh|decrypt.sh|*.enc) continue ;;
  esac
  openssl enc -aes-256-cbc -pbkdf2 -salt -in "$src" -out "$src.enc" -pass "pass:$SECRET"
  n=$((n + 1))
done
echo "encrypted $n oracle files"
