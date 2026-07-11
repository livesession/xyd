import type { LanguageSection, SdkJson, SdkLanguage } from "./types";
import { LANGUAGE_META } from "./types";

/**
 * The seed `sdk.json` the wizard opens with — mirrors `sdkJsonTemplate`
 * (`@xyd-js/opensdk-cli/src/cli/init.ts`) but pre-seeds a section for every
 * language so the language switcher always has something to preview. The
 * `behavior` block is a partial override deep-merged over
 * `defaultSdkBehavior()`; empty per-language fields fall back to the emitter's
 * derived defaults (kebab-of-title package names, etc.).
 */
export function defaultSdkJson(): SdkJson {
  return {
    $schema: "https://unpkg.com/@xyd-js/opensdk-schemas/sdk.schema.json",
    version: 1,
    sdkName: "acme",
    behavior: {
      retry: { maxRetries: 3 },
      timeout: { defaultTimeoutMs: 30000 },
    },
    publish: {
      author: "Acme",
      license: "MIT",
      repository: "https://github.com/acme/acme",
    },
    typescript: {
      packageName: "acme",
      output: "./sdk/typescript",
      busybox: false,
    },
    go: {
      modulePath: "github.com/acme/acme-go",
      goVersion: "1.22",
      output: "./sdk/go",
    },
    python: { packageName: "acme", output: "./sdk/python" },
    ruby: { packageName: "acme", moduleName: "Acme", output: "./sdk/ruby" },
    java: {
      packageName: "acme",
      basePackage: "com.acme",
      output: "./sdk/java",
    },
    csharp: {
      sdkName: "Acme",
      namespace: "Acme",
      targetFramework: "net8.0",
      output: "./sdk/csharp",
    },
  };
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "sdk"
  );
}

function pascalCase(slug: string): string {
  return (
    slug
      .split(/[-_]+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join("") || "Sdk"
  );
}

export interface SeedSdkJsonOptions {
  /** SDK display name → `sdkName` (drives the emitter-derived names). */
  sdkName: string;
  /** Which language sections to include (only these appear in the sdk.json). */
  languages: SdkLanguage[];
  /** Registry API ref, e.g. `apis/livesession/petstore@1.0.0` (informational). */
  api?: string;
  /** SDK registry ref, e.g. `sdks/livesession/livesession-api-sdk@0.1.0`. */
  sdk?: string;
  /** Base slug for package names (default: slugify(sdkName)). */
  slug?: string;
  /** Org/namespace for module paths + java package (default: the slug). */
  namespace?: string;
  /** Package version baked into publish + manifests (default: "0.1.0"). */
  version?: string;
  /** "multi" → each language IS its own repo, so its output is the repo root
   * ("."); "mono" (default) → a per-language subdir ("./sdk/<lang>"). */
  repoMode?: "mono" | "multi";
}

/**
 * Builds a seed `sdk.json` from REAL project info: only the chosen languages'
 * sections, with package names derived from the actual SDK name (not the
 * "acme" placeholder of `defaultSdkJson`). Used by the host (apitoolchain-web)
 * when opening the wizard so the config reflects the SDK being generated.
 */
export function seedSdkJson(opts: SeedSdkJsonOptions): SdkJson {
  const sdkName = opts.sdkName.trim() || "SDK";
  const slug = opts.slug || slugify(sdkName);
  const ns = opts.namespace || slug;
  const snake = slug.replace(/-/g, "_");
  const pascal = pascalCase(slug);
  const pkgVersion = opts.version || "0.1.0";
  // Multi-repo: each language is its own repo → output at the repo root.
  const out = (dir: string) => (opts.repoMode === "multi" ? "." : dir);

  const sections: Record<string, LanguageSection> = {
    typescript: {
      packageName: slug,
      output: out("./sdk/typescript"),
      busybox: false,
    },
    go: {
      modulePath: `github.com/${ns}/${slug}-go`,
      goVersion: "1.22",
      output: out("./sdk/go"),
    },
    python: { packageName: snake, output: out("./sdk/python") },
    ruby: { packageName: slug, moduleName: pascal, output: out("./sdk/ruby") },
    java: {
      packageName: slug,
      basePackage: `com.${ns.replace(/[^a-z0-9]/g, "")}`,
      output: out("./sdk/java"),
    },
    csharp: {
      sdkName: pascal,
      namespace: pascal,
      targetFramework: "net8.0",
      output: out("./sdk/csharp"),
    },
  };

  const result: SdkJson = {
    $schema: "https://unpkg.com/@xyd-js/opensdk-schemas/sdk.schema.json",
    version: 1,
    sdkName,
    ...(opts.api ? { api: opts.api } : {}),
    ...(opts.sdk ? { sdk: opts.sdk } : {}),
    behavior: {
      retry: { maxRetries: 3 },
      timeout: { defaultTimeoutMs: 30000 },
    },
    publish: { license: "MIT", version: pkgVersion },
  };
  for (const lang of opts.languages) {
    const key = LANGUAGE_META[lang].sectionKey;
    result[key] = sections[key];
  }
  return result;
}
