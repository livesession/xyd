#!/usr/bin/env bash
# Copy the BUILT apiatlas-widget dist into apitoolchain-web. apiatlas stays an
# outside repo — only self-contained built artifacts cross the boundary (the
# committed diff is the no-source-leak audit). Run after rebuilding the widget:
#   (cd ../../../apiatlas/apiatlas-widget && bun run build)
#   apps/apitoolchain-web/scripts/sync-apiatlas-widget.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"                 # apitoolchain-web
SRC="$(cd "$HERE/../../../apiatlas/apiatlas-widget/dist" && pwd)"

# Browser assets (widget.js + chunks + Monaco workers + css) → public/, served
# at /apiatlas-widget/. Node files (proxy/vite-plugin) go to vendor/ instead.
PUB="$HERE/public/apiatlas-widget"
VENDOR="$HERE/app/vendor/apiatlas-widget"
rm -rf "$PUB" "$VENDOR"
mkdir -p "$PUB" "$VENDOR"

# Everything except the node-side files → public.
( cd "$SRC" && find . -type f ! -name proxy.js ! -name vite-plugin.js -print0 \
  | cpio -0pdm --quiet "$PUB" )

# Node-side (imported by vite.config / the resource route) → vendor.
cp "$SRC/proxy.js" "$SRC/vite-plugin.js" "$VENDOR/"

# Type declaration for the vite-plugin (bun-built .js ships no .d.ts) so
# vite.config.ts's import typechecks. Stable interface — kept in the sync script.
cat > "$VENDOR/vite-plugin.d.ts" <<'DTS'
import type { Plugin } from "vite";
export interface ApiatlasWidgetProxyOptions {
  /** Mount base for the proxy (must match the widget's proxyBaseUrl). Default /apiatlas-api. */
  basePath?: string;
}
export function apiatlasWidgetProxy(options?: ApiatlasWidgetProxyOptions): Plugin;
export function handleHttpProxy(req: unknown, res: unknown): Promise<void>;
declare const _default: typeof apiatlasWidgetProxy;
export default _default;
DTS

# Traceability: stamp the apiatlas source commit.
SHA="$(git -C "$SRC/../.." rev-parse --short HEAD 2>/dev/null || echo unknown)"
printf 'apiatlas %s\n%s\n' "$SHA" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$VENDOR/VERSION"

echo "synced apiatlas-widget @ $SHA → public/apiatlas-widget/ (+ vendor node files)"
