#!/usr/bin/env bash
set -euo pipefail
# Encrypt the ENTIRE oracle directory into ONE opaque archive (oracle.enc).
# Only oracle.enc + the two scripts are committed, so neither the file NAMES
# nor their contents are exposed in the repo. The plaintext is gitignored and
# restored by oracle/decrypt.sh. Key from XYD_CONTENT_SECRET (env, else the
# gcloud secret of that name).
DIR="$(cd "$(dirname "$0")" && pwd)"

SECRET="${XYD_CONTENT_SECRET:-$(gcloud secrets versions access latest --secret=XYD_CONTENT_SECRET 2>/dev/null)}"
if [ -z "$SECRET" ]; then
  echo "error: XYD_CONTENT_SECRET not set and gcloud lookup failed" >&2
  exit 1
fi

cd "$DIR"
LIST="$(mktemp)"
trap 'rm -f "$LIST"' EXIT
# every oracle file except the scripts and the archive itself
find . -maxdepth 1 -type f \
  ! -name 'encrypt.sh' ! -name 'decrypt.sh' ! -name 'oracle.enc' ! -name '*.enc' \
  | sed 's|^\./||' | sort > "$LIST"
if [ ! -s "$LIST" ]; then
  echo "error: no oracle files to encrypt" >&2
  exit 1
fi

tar -cf - -T "$LIST" | openssl enc -aes-256-cbc -pbkdf2 -salt -out oracle.enc -pass "pass:$SECRET"
echo "encrypted $(wc -l < "$LIST" | tr -d ' ') oracle files -> oracle.enc"
