#!/usr/bin/env bash
set -euo pipefail
# Encrypt the ENTIRE .research directory (private research docs) into ONE opaque
# archive (research.enc). Only research.enc + the two scripts are committed, so
# neither the file NAMES nor their contents are exposed in the repo. The plaintext
# is gitignored and restored by .research/decrypt.sh. Mirrors the oracle/*.enc
# pattern. Key from XYD_CONTENT_SECRET (env, else the gcloud secret of that name).
DIR="$(cd "$(dirname "$0")" && pwd)"

SECRET="${XYD_CONTENT_SECRET:-$(gcloud secrets versions access latest --secret=XYD_CONTENT_SECRET 2>/dev/null)}"
if [ -z "$SECRET" ]; then
  echo "error: XYD_CONTENT_SECRET not set and gcloud lookup failed" >&2
  exit 1
fi

cd "$DIR"
LIST="$(mktemp)"
trap 'rm -f "$LIST"' EXIT
# every research file (recursively) except the scripts, the archive, and git meta
find . -type f \
  ! -name 'encrypt.sh' ! -name 'decrypt.sh' ! -name 'research.enc' ! -name '*.enc' \
  ! -name '.gitignore' ! -path './.git/*' ! -name '.git' \
  | sed 's|^\./||' | sort > "$LIST"
if [ ! -s "$LIST" ]; then
  echo "error: no research files to encrypt" >&2
  exit 1
fi

tar -cf - -T "$LIST" | openssl enc -aes-256-cbc -pbkdf2 -salt -out research.enc -pass "pass:$SECRET"
echo "encrypted $(wc -l < "$LIST" | tr -d ' ') research files -> research.enc"
