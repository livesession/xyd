import { load as yamlLoad } from "js-yaml";

export type DetectedFormat = "openapi" | "graphql" | "asyncapi" | "jsonschema";

export interface IngestResult {
  format: DetectedFormat;
  title: string;
  version: string;
  opCount: number | null;
  contentType: string;
  ext: string;
  raw: string;
}

/** Thrown for specs we can't parse / recognise → surfaced as a 422. */
export class SpecError extends Error {}

function parseStructured(
  text: string,
): { obj: unknown; isJson: boolean } | null {
  const t = text.trim();
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      return { obj: JSON.parse(text), isJson: true };
    } catch {
      // fall through to yaml
    }
  }
  try {
    return { obj: yamlLoad(text), isJson: false };
  } catch {
    return null;
  }
}

const HTTP_METHODS = new Set([
  "get",
  "put",
  "post",
  "delete",
  "patch",
  "options",
  "head",
  "trace",
]);

function countOpenapiOps(doc: Record<string, unknown>): number {
  const paths = (doc.paths ?? {}) as Record<string, Record<string, unknown>>;
  let n = 0;
  for (const item of Object.values(paths)) {
    for (const method of Object.keys(item)) {
      if (HTTP_METHODS.has(method.toLowerCase())) n++;
    }
  }
  return n;
}

function countGraphqlFields(sdl: string): number | null {
  const blocks = sdl.match(
    /type\s+(Query|Mutation|Subscription)\s*\{([^}]*)\}/g,
  );
  if (!blocks) return null;
  let n = 0;
  for (const block of blocks) {
    const body = block.slice(block.indexOf("{") + 1, block.lastIndexOf("}"));
    n += body.split("\n").filter((l) => /\w+\s*[(:]/.test(l.trim())).length;
  }
  return n || null;
}

/** Count a JSON Schema's declared shapes (top-level properties + $defs). */
function countSchemaShapes(doc: Record<string, unknown>): number | null {
  const props = doc.properties as Record<string, unknown> | undefined;
  const defs = (doc.$defs ?? doc.definitions) as
    | Record<string, unknown>
    | undefined;
  const n =
    (props ? Object.keys(props).length : 0) +
    (defs ? Object.keys(defs).length : 0);
  return n || null;
}

/**
 * Validate + classify a standalone JSON Schema document (`kind: schema`).
 * Accepts JSON or YAML; requires it to look like a schema ($schema / type /
 * properties / $defs / definitions).
 */
export function ingestSchema(
  text: string,
  hint?: { version?: string },
): IngestResult {
  if (!text || !text.trim()) throw new SpecError("empty schema");
  const structured = parseStructured(text);
  if (
    !structured ||
    typeof structured.obj !== "object" ||
    structured.obj === null ||
    Array.isArray(structured.obj)
  ) {
    throw new SpecError("schema is not a valid JSON or YAML object");
  }
  const obj = structured.obj as Record<string, unknown>;
  const looksSchema =
    "$schema" in obj ||
    "properties" in obj ||
    "$defs" in obj ||
    "definitions" in obj ||
    "type" in obj;
  if (!looksSchema) {
    throw new SpecError(
      "unrecognised schema (expected a JSON Schema with $schema/type/properties/$defs)",
    );
  }
  const idStr = typeof obj.$id === "string" ? obj.$id : undefined;
  return {
    format: "jsonschema",
    title:
      (obj.title as string) ??
      idStr
        ?.split("/")
        .pop()
        ?.replace(/\.json$/, "") ??
      "Schema",
    version: hint?.version ?? "1.0.0",
    opCount: countSchemaShapes(obj),
    contentType: structured.isJson ? "application/json" : "application/yaml",
    ext: structured.isJson ? "json" : "yaml",
    raw: text,
  };
}

/**
 * Validate + classify an uploaded spec and extract metadata, WITHOUT mutating
 * the bytes (the raw text is stored verbatim so SDK generation keeps `$ref`
 * fidelity). OpenAPI/AsyncAPI are parsed as JSON/YAML; GraphQL stays SDL;
 * `kind: schema` / `jsonschema` routes to the JSON Schema validator.
 */
export function ingestSpec(
  text: string,
  hint?: { format?: string; version?: string; kind?: string },
): IngestResult {
  if (hint?.kind === "schema" || hint?.format === "jsonschema") {
    return ingestSchema(text, hint);
  }
  if (!text || !text.trim()) throw new SpecError("empty spec");

  const head = text.slice(0, 400);
  const looksGraphql =
    (/\btype\s+Query\b/.test(text) || /\bschema\s*\{/.test(text)) &&
    !/openapi|swagger|asyncapi/i.test(head);

  const structured = parseStructured(text);

  if (hint?.format === "graphql" || (!structured && looksGraphql)) {
    return {
      format: "graphql",
      title: "GraphQL API",
      version: hint?.version ?? "1.0.0",
      opCount: countGraphqlFields(text),
      contentType: "application/graphql",
      ext: "graphql",
      raw: text,
    };
  }

  if (
    !structured ||
    typeof structured.obj !== "object" ||
    structured.obj === null
  ) {
    throw new SpecError("spec is not valid JSON, YAML, or GraphQL SDL");
  }

  const obj = structured.obj as Record<string, unknown>;
  const info = (obj.info ?? {}) as Record<string, unknown>;
  const contentType = structured.isJson
    ? "application/json"
    : "application/yaml";
  const ext = structured.isJson ? "json" : "yaml";

  if (hint?.format === "asyncapi" || obj.asyncapi) {
    return {
      format: "asyncapi",
      title: (info.title as string) ?? "AsyncAPI",
      version: hint?.version ?? (info.version as string) ?? "1.0.0",
      opCount: null,
      contentType,
      ext,
      raw: text,
    };
  }

  if (hint?.format === "openapi" || obj.openapi || obj.swagger) {
    return {
      format: "openapi",
      title: (info.title as string) ?? "API",
      version: hint?.version ?? (info.version as string) ?? "1.0.0",
      opCount: countOpenapiOps(obj),
      contentType,
      ext,
      raw: text,
    };
  }

  throw new SpecError(
    "unrecognised spec (expected an openapi/swagger, asyncapi, or graphql document)",
  );
}
