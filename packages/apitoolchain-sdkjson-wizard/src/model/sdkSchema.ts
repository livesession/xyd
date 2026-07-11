import { type FieldDef, SECTIONS } from "./fields";
import { LANGUAGE_META, SDK_LANGUAGES } from "./types";

/**
 * Builds the JSON Schema that drives the JSON editor's IntelliSense
 * (completion / hover / validation) from `fields.ts` — the same descriptor the
 * UI form renders from — enriched with the config fields that exist in the
 * types but aren't form controls (see EXTRA_GLOBAL). That keeps completion in
 * sync with what the wizard produces AND makes the schema COMPREHENSIVE, so it
 * can be `additionalProperties: false` (strict) without false-flagging valid
 * keys.
 *
 * Why strict matters: codemirror-json-schema only offers key completions when
 * the object is `additionalProperties: false`. With `true`, editing an existing
 * populated key (`"au": "Acme"`) resolves to the empty additionalProperties
 * schema and suggests nothing. Strict + comprehensive → completion works for
 * both new AND existing keys, and genuine typos error.
 *
 * The only lenient (`additionalProperties: true`) objects are genuine string
 * maps (statusCodeMap / mountRules / operationHints / aiAgentEnvVars), whose
 * keys are open by design.
 *
 * Browser-safe (no `@xyd-js/*`, no Node) — same constraint as `types.ts`.
 */

type Schema = {
  type?: string | string[];
  description?: string;
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  enum?: unknown[];
};

const map = (description: string): Schema => ({
  type: "object",
  additionalProperties: true,
  description,
});

/** Config fields present in the types (`types.ts`) but not exposed as form
 * controls in `fields.ts` — added so a strict schema doesn't reject them. */
const EXTRA_GLOBAL: Array<{ path: string; schema: Schema }> = [
  {
    path: "behavior.retry.retryableStatusCodes",
    schema: { type: "array", description: "HTTP status codes to retry on." },
  },
  {
    path: "behavior.retry.backoff.jitter",
    schema: { type: "number", description: "Backoff jitter fraction (0–1)." },
  },
  {
    path: "behavior.timeout.timeoutEnvVar",
    schema: { type: "string", description: "Env var overriding the timeout." },
  },
  {
    path: "behavior.userAgent.aiAgentEnvVars",
    schema: map("AI-agent env var → User-Agent token map."),
  },
  {
    path: "behavior.telemetry.requestIdHeader",
    schema: { type: "string", description: "Request-id header name." },
  },
  {
    path: "behavior.telemetry.headerName",
    schema: { type: "string", description: "Telemetry header name." },
  },
  {
    path: "behavior.logging.events",
    schema: { type: "array", description: "Runtime events to log." },
  },
  {
    path: "behavior.requestGuard.optionKeys",
    schema: { type: "array", description: "Reserved per-request option keys." },
  },
  {
    path: "publish.registry",
    schema: { type: "string", description: "Registry URL to publish to." },
  },
  {
    path: "publish.tokenEnv",
    schema: {
      type: "string",
      description: "Env var holding the publish auth token.",
    },
  },
  {
    path: "publish.packageName",
    schema: { type: "string", description: "Publish package name override." },
  },
];

function fieldSchema(f: FieldDef): Schema {
  const detail = f.hint ?? f.labelHint;
  const description = detail ? `${f.label} — ${detail}` : f.label;
  if (f.jsonType) return { description, type: f.jsonType };
  switch (f.control) {
    case "number":
      return { description, type: "number" };
    case "toggle":
      return { description, type: "boolean" };
    case "json":
      // A free-form string map — keys are open by design.
      return { ...map(description), description };
    case "select":
    case "segmented": {
      // Complete the STORED values (busybox maps "off" → false via toValue).
      const values = (f.options ?? []).map((o) =>
        f.toValue ? f.toValue(o.value) : o.value,
      );
      return values.length
        ? { description, enum: values }
        : { description, type: "string" };
    }
    default:
      return { description, type: "string" };
  }
}

/** Hover text for the intermediate OBJECT nodes (behavior/publish/grouping and
 * the behavior policy groups) — leaves get theirs from `fields.ts`, but these
 * wrapper objects would otherwise hover as a bare "object". */
const OBJECT_DESCRIPTIONS: Record<string, string> = {
  behavior:
    "Declarative runtime behavior — the 9 policy groups, deep-merged over the canonical defaults (empty = the built-in default).",
  "behavior.retry":
    "Automatic retry policy: attempts, backoff, retryable status codes, Retry-After handling.",
  "behavior.retry.backoff":
    "Exponential backoff between retries: min(initialDelayMs · multiplier^attempt, maxDelayMs) ± jitter.",
  "behavior.timeout": "Per-request timeout policy.",
  "behavior.errors":
    "How non-2xx responses map to typed SDK errors (status → kind, doc URL).",
  "behavior.userAgent": "User-Agent identification sent with each request.",
  "behavior.telemetry": "Telemetry / request-id header behavior.",
  "behavior.logging": "Runtime logging of SDK events.",
  "behavior.idempotency": "Idempotency-key behavior for retried writes.",
  "behavior.pagination": "Auto-pagination behavior.",
  "behavior.requestGuard": "Reserved per-request option keys.",
  publish:
    "Package identity (author/license/repo/version) baked into every manifest + README; a language section can override it.",
  grouping:
    "Spec-external resource grouping (Stainless-style beta/admin namespacing).",
};

/** Set `leaf` at a dot-path, creating intermediate STRICT object nodes (with a
 * description from OBJECT_DESCRIPTIONS so hovering the key shows more than
 * "object"). */
function setDeep(root: Schema, path: string[], leaf: Schema): void {
  let node = root;
  for (let i = 0; i < path.length - 1; i++) {
    node.properties ??= {};
    let child = node.properties[path[i]];
    if (!child) {
      child = { type: "object", properties: {}, additionalProperties: false };
      const description = OBJECT_DESCRIPTIONS[path.slice(0, i + 1).join(".")];
      if (description) child.description = description;
      node.properties[path[i]] = child;
    }
    child.properties ??= {};
    node = child;
  }
  node.properties ??= {};
  node.properties[path[path.length - 1]] = leaf;
}

export function buildSdkSchema(): Schema {
  const root: Schema = {
    type: "object",
    description: "OpenSDK sdk.json — the option surface this wizard produces.",
    properties: {
      $schema: { type: "string", description: "JSON Schema URL." },
      spec: {
        type: "string",
        description:
          "Path to the OpenAPI spec / pre-parsed IR, relative to this file.",
      },
      sdk: {
        type: "string",
        description: "SDK registry ref, e.g. sdks/acme/acme-sdk@0.1.0.",
      },
    },
    additionalProperties: false,
  };

  // Global fields → nested top-level properties (sdkName, version, api,
  // behavior.*, publish.*, grouping.*), then the non-form config fields.
  for (const section of SECTIONS) {
    for (const f of section.fields) {
      if (f.scope === "global")
        setDeep(root, f.path.split("."), fieldSchema(f));
    }
  }
  for (const e of EXTRA_GLOBAL) setDeep(root, e.path.split("."), e.schema);

  // Reuse the comprehensive behavior/publish schemas for the per-language
  // overrides too, so completion works inside `<lang>.behavior` / `.publish`.
  const rootProps = root.properties as Record<string, Schema>;
  const behaviorSchema = rootProps.behavior;
  const publishSchema = rootProps.publish;

  // One strict object property per concrete section key (typescript/go/…),
  // holding that language's emitter options.
  for (const lang of SDK_LANGUAGES) {
    const { label, sectionKey } = LANGUAGE_META[lang];
    const properties: Record<string, Schema> = {};
    for (const section of SECTIONS) {
      for (const f of section.fields) {
        if (f.scope !== "language") continue;
        if (f.langs && !f.langs.includes(lang)) continue;
        properties[f.path] = fieldSchema(f);
      }
    }
    if (behaviorSchema) properties.behavior = behaviorSchema;
    if (publishSchema) properties.publish = publishSchema;
    rootProps[sectionKey] = {
      type: "object",
      description: `${label} SDK target options.`,
      properties,
      additionalProperties: false,
    };
  }

  return root;
}
