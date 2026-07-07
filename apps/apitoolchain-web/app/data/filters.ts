import { defineFilterSchema, type FilterSchema } from "@apitoolchain/filters";

/**
 * Filter schemas per surface. The field `key` doubles as the row property read
 * by `filter.run(rows)` and the SQL column serialized into `?q=`. Enum `values`
 * (e.g. namespaces) are data-driven, so these take the distinct values present.
 */

export function registryFilterSchema(namespaces: string[]): FilterSchema {
  return defineFilterSchema({
    table: "registry",
    fields: [
      {
        key: "namespace",
        label: "Namespace",
        column: "namespace",
        type: "enum",
        icon: "registry",
        values: namespaces.map((n) => ({ value: n, label: n })),
      },
      {
        key: "format",
        label: "Format",
        column: "format",
        type: "enum",
        icon: "docs",
        values: [
          { value: "openapi", label: "OpenAPI" },
          { value: "graphql", label: "GraphQL" },
          { value: "asyncapi", label: "AsyncAPI" },
          { value: "jsonschema", label: "JSON Schema" },
        ],
      },
      {
        key: "name",
        label: "Name",
        column: "name",
        type: "text",
        icon: "search",
        freeText: true,
      },
    ],
  });
}

export function sdkFilterSchema(namespaces: string[]): FilterSchema {
  return defineFilterSchema({
    table: "sdks",
    fields: [
      {
        key: "namespace",
        label: "Namespace",
        column: "namespace",
        type: "enum",
        icon: "registry",
        values: namespaces.map((n) => ({ value: n, label: n })),
      },
      {
        key: "name",
        label: "Name",
        column: "name",
        type: "text",
        icon: "search",
        freeText: true,
      },
    ],
  });
}

export function sdkTargetFilterSchema(
  namespaces: string[],
  languages: string[],
): FilterSchema {
  return defineFilterSchema({
    table: "sdk_targets",
    fields: [
      {
        key: "namespace",
        label: "Namespace",
        column: "namespace",
        type: "enum",
        icon: "registry",
        values: namespaces.map((n) => ({ value: n, label: n })),
      },
      {
        key: "language",
        label: "Language",
        column: "language",
        type: "enum",
        icon: "sdk",
        values: languages.map((l) => ({ value: l, label: l })),
      },
      {
        // Searches a combined string on each row (package + SDK + language).
        key: "search",
        label: "Name",
        column: "search",
        type: "text",
        icon: "search",
        freeText: true,
      },
    ],
  });
}

/** Targets of a single SDK — no namespace facet (they all share one). */
export function sdkTargetDetailFilterSchema(languages: string[]): FilterSchema {
  return defineFilterSchema({
    table: "sdk_targets",
    fields: [
      {
        key: "language",
        label: "Language",
        column: "language",
        type: "enum",
        icon: "sdk",
        values: languages.map((l) => ({ value: l, label: l })),
      },
      {
        // Searches a combined string on each row (package + language).
        key: "search",
        label: "Name",
        column: "search",
        type: "text",
        icon: "search",
        freeText: true,
      },
    ],
  });
}

/** Every version of every target for one SDK — faceted by language + version. */
export function sdkVersionsFilterSchema(
  languages: string[],
  versions: string[],
): FilterSchema {
  return defineFilterSchema({
    table: "sdk_targets",
    fields: [
      {
        key: "language",
        label: "Language",
        column: "language",
        type: "enum",
        icon: "sdk",
        values: languages.map((l) => ({ value: l, label: l })),
      },
      {
        key: "version",
        label: "Version",
        column: "version",
        type: "enum",
        icon: "tags-outline",
        values: versions.map((v) => ({ value: v, label: v })),
      },
      {
        // Searches a combined string on each row (package + language + version).
        key: "search",
        label: "Name",
        column: "search",
        type: "text",
        icon: "search",
        freeText: true,
      },
    ],
  });
}

export function docsFilterSchema(
  apis: { id: string; name: string }[],
  themes: string[],
): FilterSchema {
  return defineFilterSchema({
    table: "docs",
    fields: [
      {
        key: "apiId",
        label: "API",
        column: "api_id",
        type: "enum",
        icon: "registry",
        values: apis.map((a) => ({ value: a.id, label: a.name })),
      },
      {
        key: "theme",
        label: "Theme",
        column: "theme",
        type: "enum",
        icon: "docs",
        values: themes.map((t) => ({ value: t, label: t })),
      },
      {
        key: "status",
        label: "Status",
        column: "status",
        type: "enum",
        icon: "check",
        values: [
          { value: "ready", label: "Ready" },
          { value: "building", label: "Building" },
          { value: "error", label: "Error" },
        ],
      },
      {
        // Searches a combined string on each row (name + API + source spec).
        key: "search",
        label: "Name",
        column: "search",
        type: "text",
        icon: "search",
        freeText: true,
      },
    ],
  });
}

export function mcpFilterSchema(
  apis: { id: string; name: string }[],
): FilterSchema {
  return defineFilterSchema({
    table: "mcp_servers",
    fields: [
      {
        key: "apiId",
        label: "API",
        column: "api_id",
        type: "enum",
        icon: "registry",
        values: apis.map((a) => ({ value: a.id, label: a.name })),
      },
      {
        key: "transport",
        label: "Transport",
        column: "transport",
        type: "enum",
        icon: "mcp",
        values: [
          { value: "http", label: "HTTP" },
          { value: "sse", label: "SSE" },
          { value: "stdio", label: "stdio" },
        ],
      },
      {
        key: "status",
        label: "Status",
        column: "status",
        type: "enum",
        icon: "check",
        values: [
          { value: "ready", label: "Ready" },
          { value: "building", label: "Building" },
          { value: "error", label: "Error" },
        ],
      },
      {
        key: "search",
        label: "Name",
        column: "search",
        type: "text",
        icon: "search",
        freeText: true,
      },
    ],
  });
}
