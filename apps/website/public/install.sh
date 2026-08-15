#!/usr/bin/env bash
#
# xyd native CLI installer — the self-contained, node-free binary.
#
#   curl -fsSL https://xyd.dev/install | bash            # latest stable
#   curl -fsSL https://canary.xyd.dev/install | bash     # latest canary
#   curl -fsSL https://xyd.dev/install@0.1.0 | bash      # a specific version
#
# Channel + version are injected by the server (the /install edge function) into
# the two placeholders below; you can also override them directly:
#   XYD_INSTALL_CHANNEL=canary  curl -fsSL https://xyd.dev/install | bash
#   XYD_INSTALL_VERSION=v0.1.0  curl -fsSL https://xyd.dev/install | bash
#   XYD_INSTALL_DIR=/opt/xyd    curl -fsSL https://xyd.dev/install | bash
set -euo pipefail

CHANNEL="${XYD_INSTALL_CHANNEL:-__XYD_CHANNEL__}"
VERSION="${XYD_INSTALL_VERSION:-__XYD_VERSION__}"
REPO="livesession/xyd"
INSTALL_DIR="${XYD_INSTALL_DIR:-$HOME/.xyd}"
BIN_DIR="$INSTALL_DIR/bin"

# When the raw script is fetched without the edge function substituting them, the
# placeholders survive — fall back to stable / latest.
case "$CHANNEL" in __XYD_*) CHANNEL="stable" ;; esac
case "$VERSION" in __XYD_*) VERSION="" ;; esac

err() { echo "xyd install: $*" >&2; exit 1; }

command -v curl >/dev/null 2>&1 || err "curl is required"

# --- platform detection --------------------------------------------------------
os="$(uname -s)"
arch="$(uname -m)"
case "$os" in
  Darwin) os="darwin" ;;
  Linux)  os="linux" ;;
  *) err "unsupported OS: $os (supported: macOS, Linux)" ;;
esac
case "$arch" in
  arm64|aarch64) arch="arm64" ;;
  x86_64|amd64)  arch="x64" ;;
  *) err "unsupported architecture: $arch (supported: arm64, x64)" ;;
esac
asset="xyd-${os}-${arch}"

# --- resolve the release tag ---------------------------------------------------
gh_api="https://api.github.com/repos/${REPO}"
if [ -n "$VERSION" ]; then
  tag="$VERSION"
  # normalize a bare semver → v<semver>; v* and canary-* pass through
  case "$tag" in
    v*|canary-*) : ;;
    [0-9]*) tag="v$tag" ;;
  esac
elif [ "$CHANNEL" = "canary" ]; then
  # newest canary-* prerelease
  tag="$(curl -fsSL "${gh_api}/releases?per_page=30" \
    | grep -oE '"tag_name": *"canary-[^"]*"' | head -n1 \
    | sed -E 's/.*"(canary-[^"]*)".*/\1/')"
  [ -n "$tag" ] || err "no canary release found for ${REPO}"
else
  # newest stable (non-prerelease) release
  tag="$(curl -fsSL "${gh_api}/releases/latest" \
    | grep -oE '"tag_name": *"[^"]*"' | head -n1 \
    | sed -E 's/.*"tag_name": *"([^"]*)".*/\1/')"
  [ -n "$tag" ] || err "could not resolve the latest release for ${REPO}"
fi

url="https://github.com/${REPO}/releases/download/${tag}/${asset}"
echo "Installing xyd ${tag} (${asset})…"

# --- download + install --------------------------------------------------------
mkdir -p "$BIN_DIR"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
if ! curl -fSL --progress-bar "$url" -o "$tmp"; then
  err "failed to download ${url}
     (no ${asset} asset on release ${tag}? try a different version or platform)"
fi
chmod +x "$tmp"
mv -f "$tmp" "$BIN_DIR/xyd"
trap - EXIT

# macOS: the binary is ad-hoc codesigned (allow-jit) but not notarized; clear the
# quarantine attribute if present so Gatekeeper doesn't block it.
if [ "$os" = "darwin" ]; then
  xattr -dr com.apple.quarantine "$BIN_DIR/xyd" 2>/dev/null || true
fi

echo "Installed → $BIN_DIR/xyd"

# --- PATH setup ----------------------------------------------------------------
add_to_profile() {
  profile="$1"; line="$2"
  [ -f "$profile" ] || return 0
  grep -qsF "$line" "$profile" 2>/dev/null && return 0
  printf '\n# xyd\n%s\n' "$line" >> "$profile"
  echo "Added $BIN_DIR to PATH in $profile"
}

case "${SHELL:-}" in
  */fish)
    add_to_profile "$HOME/.config/fish/config.fish" "fish_add_path \"$BIN_DIR\""
    ;;
  */zsh)
    add_to_profile "$HOME/.zshrc" "export PATH=\"$BIN_DIR:\$PATH\""
    ;;
  *)
    add_to_profile "$HOME/.bashrc" "export PATH=\"$BIN_DIR:\$PATH\""
    add_to_profile "$HOME/.profile" "export PATH=\"$BIN_DIR:\$PATH\""
    ;;
esac

echo ""
echo "xyd ${tag} installed 🎉"
case ":$PATH:" in
  *":$BIN_DIR:"*) : ;;
  *)
    echo "Restart your shell, or run this to use xyd now:"
    echo "  export PATH=\"$BIN_DIR:\$PATH\""
    ;;
esac
echo "Then: xyd --version"
