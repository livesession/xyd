import type { SdkLanguage } from "./types";

/**
 * Data-driven descriptor of the `sdk.json` option surface. The form renders
 * itself from this; add/remove options here. Mirrors the option surface of
 * `@xyd-js/opensdk-core` (config + behavior) + the per-language emitter option
 * interfaces (`@xyd-js/opensdk-<lang>/src/types.ts`).
 *
 * `hint` is the single source of an option's description: the Form shows it under
 * the control, and `sdkSchema.ts` derives the JSON-editor hover/validation text
 * (`<label> — <hint>`) from it. Keep hints faithful to the canonical
 * `@xyd-js/opensdk-schemas` `sdk.schema.json`.
 */

export type FieldControl =
  | "text"
  | "number"
  | "toggle"
  | "segmented"
  | "select"
  | "json";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  /** Global fields: a dot-path into SdkJson. Language fields: the bare option key
   * (the effective path is `<sectionKey>.<key>`). */
  path: string;
  scope: "global" | "language";
  label: string;
  hint?: string;
  /** Longer explanation revealed by an info (ⓘ) icon next to the label — for
   * verbose help that would clutter the form as always-visible `hint` text. */
  labelHint?: string;
  control: FieldControl;
  options?: FieldOption[];
  placeholder?: string;
  /** Language-scoped fields: which languages show this option (default: all). */
  langs?: SdkLanguage[];
  /** Map a stored value ⇄ the control's string value (e.g. busybox false ⇄ "off"). */
  toDisplay?: (value: unknown) => string;
  toValue?: (display: string) => unknown;
  /** Override the generated JSON Schema `type` for this field's value (e.g.
   * `["boolean","string"]`). Default: derived from `control`. */
  jsonType?: string | string[];
}

export interface SectionDef {
  id: string;
  title: string;
  description?: string;
  fields: FieldDef[];
}

const LICENSES: FieldOption[] = [
  "MIT",
  "Apache-2.0",
  "BSD-3-Clause",
  "ISC",
  "MPL-2.0",
  "GPL-3.0-only",
  "Unlicense",
].map((v) => ({ value: v, label: v }));

/** busybox stores `false | "static" | "flat" | "namespace"`; the control uses "off". */
const busyboxToDisplay = (v: unknown): string =>
  typeof v === "string" ? v : v ? "namespace" : "off";
const busyboxToValue = (s: string): unknown => (s === "off" ? false : s);

export const SECTIONS: SectionDef[] = [
  {
    id: "identity",
    title: "Source & identity",
    description: "What SDK this config builds, and the spec it generates from.",
    fields: [
      {
        path: "sdkName",
        scope: "global",
        label: "SDK name",
        control: "text",
        placeholder: "acme",
        hint: "Base name the converter derives package, module, and namespace names from.",
      },
      {
        path: "version",
        scope: "global",
        label: "Config version",
        control: "number",
        hint: "sdk.json config-schema version (currently 1).",
      },
      {
        path: "api",
        scope: "global",
        label: "API ref / spec",
        control: "text",
        placeholder: "apis/acme/petstore@1.0.0",
        hint: "Registry ref (apis/<ns>/<id>@<version>) — the API whose OpenAPI drives generation and the preview.",
      },
    ],
  },
  {
    id: "shape",
    title: "Package identity & imports / exports",
    description:
      "The knobs with the strongest effect on the generated code — how the package is named and how it's imported/exported.",
    fields: [
      // naming, per language
      {
        path: "packageName",
        scope: "language",
        langs: ["node", "python", "ruby", "java"],
        label: "Package name",
        control: "text",
        placeholder: "acme",
        hint: "Registry package name (npm / PyPI / gem / Java). Default: derived from the API title.",
      },
      {
        path: "modulePath",
        scope: "language",
        langs: ["go"],
        label: "Go module path",
        control: "text",
        placeholder: "github.com/acme/acme-go",
        hint: "Go module path for go.mod. Default: github.com/example/<packageName>.",
      },
      {
        path: "goVersion",
        scope: "language",
        langs: ["go"],
        label: "go directive",
        control: "text",
        placeholder: "1.22",
        hint: 'The `go` directive in go.mod (default: "1.22").',
      },
      {
        path: "moduleName",
        scope: "language",
        langs: ["ruby"],
        label: "Ruby module",
        control: "text",
        placeholder: "Acme",
        hint: "Top-level Ruby module / namespace. Default: PascalCase of the API title.",
      },
      {
        path: "basePackage",
        scope: "language",
        langs: ["java"],
        label: "Base package",
        control: "text",
        placeholder: "com.acme",
        hint: 'The Java package prefix the SDK nests under (default: "com.example").',
      },
      {
        path: "sdkName",
        scope: "language",
        langs: ["dotnet"],
        label: "SDK name (.csproj / client)",
        control: "text",
        placeholder: "Acme",
        hint: "Drives the .csproj filename and the <Sdk>Client class. Default: PascalCase of the API title.",
      },
      {
        path: "namespace",
        scope: "language",
        langs: ["dotnet"],
        label: "Root namespace",
        control: "text",
        placeholder: "Acme",
        hint: "Root namespace for every emitted type (default: Example.<Sdk>).",
      },
      {
        path: "targetFramework",
        scope: "language",
        langs: ["dotnet"],
        label: "Target framework",
        control: "text",
        placeholder: "net8.0",
        hint: 'The .csproj target framework moniker (default: "net8.0").',
      },
      // node imports/exports — the showcase
      {
        path: "exportDefault",
        scope: "language",
        langs: ["node"],
        label: "Default export name",
        control: "text",
        placeholder: "Acme",
        jsonType: ["boolean", "string"],
        hint: "Emit the client as a default export (import Acme from 'acme'). Blank → derived name; a name → that symbol.",
        labelHint:
          "Default export. Blank → the derived name (import Acme from 'acme'); a name → import <Name> from 'acme'.",
      },
      {
        path: "exportPackage",
        scope: "language",
        langs: ["node"],
        label: "Named export name",
        control: "text",
        placeholder: "Acme",
        jsonType: ["boolean", "string"],
        hint: "Emit as a NAMED export instead (import { Acme } from 'acme') — wins over the default export. Enter a symbol name to use it; leave blank to keep the default export (no named export).",
        labelHint:
          "Set to export as a NAMED import instead: import { <Name> } from 'acme'.",
      },
      {
        path: "busybox",
        scope: "language",
        langs: ["node"],
        label: "Error-helpers (busybox)",
        control: "segmented",
        options: [
          { value: "off", label: "off" },
          { value: "static", label: "static" },
          { value: "flat", label: "flat" },
          { value: "namespace", label: "namespace" },
        ],
        toDisplay: busyboxToDisplay,
        toValue: busyboxToValue,
        hint: "Ship error-handling helpers (isNotFound / errMessage / status predicates) built on the SDK's APIError — as static client members, flat named exports, or a `busybox` namespace object. off = none.",
      },
      {
        path: "envVar",
        scope: "language",
        langs: ["node"],
        label: "Credential env var",
        control: "text",
        placeholder: "ACME_API_KEY",
        hint: "Env var the client reads the credential from when no apiKey is passed. Default: the scheme's envVar, else <PKG>_API_KEY.",
      },
      // common to all
      {
        path: "baseURL",
        scope: "language",
        label: "Base URL",
        control: "text",
        placeholder: "https://api.acme.com",
        hint: "Default API base URL baked into the runtime (overridable at runtime). Default: the first `servers` entry.",
      },
      {
        path: "output",
        scope: "language",
        label: "Output dir",
        control: "text",
        placeholder: "./sdk/<lang>",
        hint: "Output directory for this language's generated SDK.",
      },
      {
        path: "tests",
        scope: "language",
        label: "Emit self-test suite",
        control: "toggle",
        hint: "Emit the SDK's own test suite (default: on).",
      },
    ],
  },
  {
    id: "behavior",
    title: "Runtime behavior",
    description:
      "The 9 policy groups, deep-merged over the canonical defaults. Empty = the built-in default.",
    fields: [
      {
        path: "behavior.retry.maxRetries",
        scope: "global",
        label: "Max retries",
        control: "number",
        hint: "Maximum retry attempts after the first request (default 2).",
      },
      {
        path: "behavior.retry.retryConnectionErrors",
        scope: "global",
        label: "Retry connection errors",
        control: "toggle",
        hint: "Retry transport / connection errors, not just HTTP statuses.",
      },
      {
        path: "behavior.retry.honorRetryAfterHeader",
        scope: "global",
        label: "Honor Retry-After",
        control: "toggle",
        hint: "Let a Retry-After response header override the computed backoff.",
      },
      {
        path: "behavior.retry.backoff.initialDelayMs",
        scope: "global",
        label: "Backoff initial (ms)",
        control: "number",
        hint: "Delay before the first retry (default 500).",
      },
      {
        path: "behavior.retry.backoff.maxDelayMs",
        scope: "global",
        label: "Backoff max (ms)",
        control: "number",
        hint: "Upper bound on the computed backoff delay (default 8000).",
      },
      {
        path: "behavior.retry.backoff.multiplier",
        scope: "global",
        label: "Backoff multiplier",
        control: "number",
        hint: "Exponential growth factor per attempt (default 2).",
      },
      {
        path: "behavior.timeout.defaultTimeoutMs",
        scope: "global",
        label: "Timeout (ms)",
        control: "number",
        hint: "Default per-request timeout; 0 = no deadline (default 60000).",
      },
      {
        path: "behavior.errors.clientErrorKind",
        scope: "global",
        label: "4xx error kind",
        control: "text",
        placeholder: "API",
        hint: "Error kind raised for unmapped 4xx statuses.",
      },
      {
        path: "behavior.errors.serverErrorKind",
        scope: "global",
        label: "5xx error kind",
        control: "text",
        placeholder: "Internal",
        hint: "Error kind raised for 5xx statuses.",
      },
      {
        path: "behavior.errors.errorDocUrlTemplate",
        scope: "global",
        label: "Error doc URL template",
        control: "text",
        placeholder: "https://api.acme.com/errors/{kind}",
        hint: "URL template for error docs; {kind} is substituted per error.",
      },
      {
        path: "behavior.errors.statusCodeMap",
        scope: "global",
        label: "Status → error kind",
        control: "json",
        hint: 'Map an exact HTTP status → error kind, e.g. { "404": "NotFound" }.',
      },
      {
        path: "behavior.userAgent.sdkIdentifierTemplate",
        scope: "global",
        label: "User-Agent template",
        control: "text",
        placeholder: "{package}-{language}/{version}",
        hint: "User-Agent template; {package}, {language}, {version} are substituted.",
      },
      {
        path: "behavior.userAgent.includeRuntimeVersion",
        scope: "global",
        label: "Include runtime version in UA",
        control: "toggle",
        hint: "Append the language runtime version to the User-Agent (e.g. go1.22, python/3.12).",
      },
      {
        path: "behavior.telemetry.enabledByDefault",
        scope: "global",
        label: "Telemetry on by default",
        control: "toggle",
        hint: "Enable the client-telemetry header (previous request id + latency). Off by default.",
      },
      {
        path: "behavior.idempotency.headerName",
        scope: "global",
        label: "Idempotency header",
        control: "text",
        placeholder: "Idempotency-Key",
        hint: "Wire name of the idempotency-key header.",
      },
      {
        path: "behavior.idempotency.autoGenerateForPost",
        scope: "global",
        label: "Auto idempotency key on retried POST",
        control: "toggle",
        hint: "Auto-generate a key for retried POSTs on operations flagged idempotent.",
      },
      {
        path: "behavior.pagination.autoPageDelayMs",
        scope: "global",
        label: "Auto-page delay (ms)",
        control: "number",
        hint: "Politeness delay between auto-fetched pages (default 0).",
      },
    ],
  },
  {
    id: "publish",
    title: "Publish identity",
    description:
      "Baked into every manifest (package.json / go.mod / …) + README.",
    fields: [
      {
        path: "publish.author",
        scope: "global",
        label: "Author",
        control: "text",
        placeholder: "Acme",
        hint: "Package author (spec.info.contact.name).",
      },
      {
        path: "publish.license",
        scope: "global",
        label: "License (SPDX)",
        control: "select",
        options: LICENSES,
        hint: "SPDX license id (spec.info.license.identifier).",
      },
      {
        path: "publish.repository",
        scope: "global",
        label: "Repository",
        control: "text",
        placeholder: "https://github.com/acme/acme",
        hint: "Source repository URL (spec.info.repository).",
      },
      {
        path: "publish.homepage",
        scope: "global",
        label: "Homepage",
        control: "text",
        placeholder: "https://acme.com",
        hint: "Project homepage URL (spec.info.homepage).",
      },
      {
        path: "publish.version",
        scope: "global",
        label: "Package version",
        control: "text",
        placeholder: "1.0.0",
        hint: "Package version override (else spec.info.version).",
      },
    ],
  },
  {
    id: "grouping",
    title: "Grouping (advanced)",
    description:
      "Spec-external resource remapping (Stainless-style beta/admin namespacing).",
    fields: [
      {
        path: "grouping.mountRules",
        scope: "global",
        label: "Mount rules",
        control: "json",
        hint: 'Remap a resource onto another path, e.g. { "assistants": "beta/assistants" }.',
      },
      {
        path: "grouping.operationHints",
        scope: "global",
        label: "Operation hints",
        control: "json",
        hint: 'Per-operation overrides (mount point / action), keyed by "METHOD /path".',
      },
    ],
  },
];
