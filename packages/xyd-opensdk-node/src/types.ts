/** How the busybox error-helpers are exposed from the generated SDK. */
export type BusyboxStyle = "static" | "flat" | "namespace";

/** Fine-grained busybox configuration (the object form of the `busybox` option). */
export interface BusyboxOptions {
  /**
   * How the helpers are exposed:
   * - `'static'`    — static members on the client class:
   *   `ApitoolchainRegistry.isNotFound(err)`.
   * - `'flat'`      — flat named exports:
   *   `import { isNotFound } from '@apitoolchain/registry-api-node'`.
   * - `'namespace'` — a single namespace object:
   *   `import { busybox } from '@apitoolchain/registry-api-node'` then
   *   `busybox.isNotFound(err)`.
   *
   * Default: `'namespace'`.
   */
  style?: BusyboxStyle;
  /**
   * For `'namespace'` style: the exported object's name — pick your own:
   * `{ style: 'namespace', name: 'apiutils' }` →
   * `import { apiutils } from '@apitoolchain/registry-api-node'`. Default:
   * `'busybox'`.
   */
  name?: string;
}

export interface OpensdkNodeOptions {
  /** npm package name for the generated SDK. Default: derived from `info.title` (kebab-case). */
  packageName?: string;
  /**
   * Emit the client as a **default export** — `import Acme from 'acme'`. This is
   * the behavior when neither export option is set.
   *
   * - `true` — the symbol is derived (PascalCase) from the package name.
   * - a string — that exact symbol: `exportDefault: 'Abc'` → `import Abc from 'acme'`.
   */
  exportDefault?: boolean | string;
  /**
   * Emit the client as a **named export** instead — `import { Acme } from 'acme'`.
   * Takes precedence over {@link exportDefault} when set.
   *
   * - `true` — the symbol is derived (PascalCase) from the package name:
   *   `@cloudinary/analysis` → `import { CloudinaryAnalysis } from '@cloudinary/analysis'`.
   * - a string — that exact symbol: `exportPackage: 'Leonardo'` →
   *   `import { Leonardo } from '@leonardo-ai/sdk'`.
   */
  exportPackage?: boolean | string;
  /**
   * Default API base URL baked into the fetch runtime (overridable at runtime via
   * `new Client({ baseURL })`). Default: the first `servers` entry.
   */
  baseURL?: string;
  /**
   * Environment variable the client reads the credential from when no `apiKey`
   * is passed. Default: the security scheme's `envVar`, else `<PKG>_API_KEY`.
   */
  envVar?: string;
  /** Emit the SDK's own `node:test` suite (default true). Set false to skip generateTests. */
  tests?: boolean;
  /**
   * When set, a generated USAGE snippet constructs the client reading its base URL
   * from this environment variable (`baseURL: process.env[<baseUrlEnv>]`) INSTEAD
   * of the SDK default — so a snippet can be RUN against a recording server (ask
   * C.2). Only alters `generateUsage`; unset (the default) leaves the snippet
   * byte-identical. Not a persisted SDK option — it is passed per snippet-run.
   */
  baseUrlEnv?: string;
  /**
   * Ship a "busybox" of error-handling helpers in the generated SDK
   * (`isNotFound`, `errMessage`, `apiErrMessage`, status predicates …), all built
   * on the SDK's own `APIError`. Off by default.
   *
   * - `false` / omitted — no helpers.
   * - `true`            — the `busybox` namespace object
   *   (`import { busybox } from '<pkg>'`).
   * - a style string    — `'static' | 'flat' | 'namespace'` (see {@link BusyboxOptions}).
   * - an object         — `{ style, name }` for a custom namespace name.
   */
  busybox?: boolean | BusyboxStyle | BusyboxOptions;
}
