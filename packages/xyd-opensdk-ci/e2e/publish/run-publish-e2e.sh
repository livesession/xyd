#!/usr/bin/env bash
# Run the per-language SDK publish e2e against ISOLATED local registries.
#
# The 3 HTTP registries (npm/PyPI/RubyGems) run in docker-compose so nothing
# lingers on the host; dotnet/Maven/Go use throwaway file feeds. A green run
# proves each SDK can be generated → published → installed back → loaded.
#
#   bash run-publish-e2e.sh              # all languages with an available toolchain
#   LANGS="node python" bash run-publish-e2e.sh
#
# Requires: docker (for the 3 daemons) + whatever language toolchains you want to
# exercise (npm / python3+twine / gem / dotnet / mvn / go). Missing toolchains or
# registries skip cleanly.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$here/../../../.." && pwd)"

cd "$here"
echo "==> starting isolated registries (verdaccio / pypiserver / gemstash)"
docker compose up -d --wait

feeds="$(mktemp -d)"
cleanup() {
  echo "==> tearing down"
  docker compose down -v || true
  rm -rf "$feeds"
}
trap cleanup EXIT

export E2E_SDK_PUBLISH=1
export PUBLISH_NPM_REGISTRY="http://localhost:4873"
export PUBLISH_PYPI_URL="http://localhost:8081"
export PUBLISH_GEM_HOST="http://localhost:9292/private"
export PUBLISH_NUGET_FEED="$feeds/nuget"
export PUBLISH_MAVEN_REPO="$feeds/maven"
export PUBLISH_GOPROXY_DIR="$feeds/goproxy"
mkdir -p "$PUBLISH_NUGET_FEED" "$PUBLISH_MAVEN_REPO" "$PUBLISH_GOPROXY_DIR"

declare -A pkg=(
  [node]=@xyd-js/opensdk-node [python]=@xyd-js/opensdk-python [ruby]=@xyd-js/opensdk-ruby
  [dotnet]=@xyd-js/opensdk-dotnet [java]=@xyd-js/opensdk-java [go]=@xyd-js/opensdk-go
)
langs="${LANGS:-node python ruby dotnet java go}"

cd "$repo_root"
rc=0
for lang in $langs; do
  echo "==> publish e2e: $lang"
  pnpm --filter "${pkg[$lang]}" exec vitest run __tests__/e2e/publish.test.ts || rc=1
done
exit $rc
