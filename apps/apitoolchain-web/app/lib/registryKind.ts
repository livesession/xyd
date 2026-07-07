import type { PackageRegistryKind, SdkLanguage } from "~/data";

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
