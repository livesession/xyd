import type { IconName } from "@apitoolchain/design-system";
import type { PackageRegistry, PackageRegistryKind, SdkLanguage } from "~/data";

/** Brand icon per package-registry kind (design-system icon registry) — the
 * publishing-side analog of `KIND_ICON` for git providers. */
export const REGISTRY_KIND_ICON: Record<PackageRegistryKind, IconName> = {
  npm: "npm",
  pypi: "pypi",
  gems: "gems",
  maven: "maven",
  nuget: "nuget",
  goproxy: "goproxy",
};

/** Human label per package-registry kind. */
export const REGISTRY_KIND_LABEL: Record<PackageRegistryKind, string> = {
  npm: "npm",
  pypi: "PyPI",
  gems: "RubyGems",
  maven: "Maven",
  nuget: "NuGet",
  goproxy: "Go proxy",
};

export const REGISTRY_KINDS: PackageRegistryKind[] = [
  "npm",
  "pypi",
  "gems",
  "maven",
  "nuget",
  "goproxy",
];

/** The registry an SDK language publishes into. */
export const LANG_TO_REGISTRY_KIND: Record<SdkLanguage, PackageRegistryKind> = {
  node: "npm",
  python: "pypi",
  go: "goproxy",
  ruby: "gems",
  java: "maven",
  dotnet: "nuget",
};

/** A representative language per kind (drives the brand icon on a registry). */
export const REGISTRY_KIND_TO_LANG: Record<PackageRegistryKind, SdkLanguage> = {
  npm: "node",
  pypi: "python",
  gems: "ruby",
  maven: "java",
  nuget: "dotnet",
  goproxy: "go",
};

/**
 * A human-clickable web URL for a published package on its registry — the
 * browsable "package page", not the machine metadata endpoint. Returns null when
 * one can't be built (no package name, or a local file-feed registry).
 */
export function packageRegistryUrl(
  registry: Pick<PackageRegistry, "kind" | "url">,
  packageName: string,
): string | null {
  const pkg = packageName.trim();
  if (!pkg) return null;
  const base = registry.url.replace(/\/+$/, "");
  const http = /^https?:\/\//.test(base);
  switch (registry.kind) {
    case "npm":
      // Public npm has a package page; a self-hosted verdaccio-style registry
      // serves one at `/-/web/detail/<pkg>`.
      if (!http || /npmjs\.(org|com)/.test(base))
        return `https://www.npmjs.com/package/${pkg}`;
      return `${base}/-/web/detail/${pkg}`;
    case "pypi":
      if (!http || /pypi\.org/.test(base))
        return `https://pypi.org/project/${pkg}/`;
      return `${base}/project/${pkg}/`;
    case "gems":
      return `https://rubygems.org/gems/${pkg}`;
    case "nuget":
      return `https://www.nuget.org/packages/${pkg}`;
    default:
      // maven / goproxy — coordinates or file feeds, no canonical web page.
      return http ? `${base}/${pkg}` : null;
  }
}
