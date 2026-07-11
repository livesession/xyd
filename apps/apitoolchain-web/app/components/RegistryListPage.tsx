import {
  Badge,
  type BadgeTone,
  Button,
  ButtonCTA,
  ButtonGroup,
  type Column,
  EmptyState,
  LaTable,
  PageHeader,
  Tabs,
} from "@apitoolchain/design-system";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { NewApiModal } from "~/components/NewApiModal";
import { RegisterApiModal } from "~/components/RegisterApiModal";
import { RouterLink } from "~/components/RouterLink";
import type { ApiFormat, EntryKind, RegistryEntry } from "~/data";
import { registryFilterSchema } from "~/data/filters";
import { useUrlFilters } from "~/hooks/useUrlFilters";
import { formatVersion } from "~/version";

export const FORMAT: Record<ApiFormat, { tone: BadgeTone; label: string }> = {
  openapi: { tone: "info", label: "OpenAPI" },
  graphql: { tone: "accent", label: "GraphQL" },
  asyncapi: { tone: "warning", label: "AsyncAPI" },
  jsonschema: { tone: "success", label: "JSON Schema" },
};

const nameCol: Column<RegistryEntry> = {
  key: "name",
  header: "Name",
  width: "wide",
  render: (a) => (
    <div className="min-w-0">
      <div className="font-medium text-ink">{a.name}</div>
      <div className="text-xs text-subtle">
        {a.namespace}/{a.id}
      </div>
    </div>
  ),
};
const formatCol: Column<RegistryEntry> = {
  key: "format",
  header: "Format",
  width: "sm",
  render: (a) => (
    <Badge tone={FORMAT[a.format].tone}>{FORMAT[a.format].label}</Badge>
  ),
};
const versionCol: Column<RegistryEntry> = {
  key: "versions",
  header: "Version",
  width: "sm",
  render: (a) => formatVersion(a.versions.find((v) => v.current)?.version),
};
const updatedCol: Column<RegistryEntry> = {
  key: "updatedAt",
  header: "Updated",
  width: "md",
  align: "right",
  render: (a) => <span className="text-subtle">{a.updatedAt}</span>,
};

const API_COLUMNS: Column<RegistryEntry>[] = [
  nameCol,
  formatCol,
  versionCol,
  {
    key: "outputs",
    header: "Outputs",
    width: "lg",
    render: (a) => (
      <div className="flex gap-1.5">
        <Badge tone="neutral" icon="sdk">
          {a.sdkTargetCount}
        </Badge>
        <Badge tone="neutral" icon="docs">
          {a.docsProjectCount}
        </Badge>
        <Badge tone="neutral" icon="mcp">
          {a.mcpServerCount}
        </Badge>
      </div>
    ),
  },
  updatedCol,
];

const SCHEMA_COLUMNS: Column<RegistryEntry>[] = [
  nameCol,
  formatCol,
  versionCol,
  {
    key: "tags",
    header: "Dist-tag",
    width: "lg",
    render: (a) => (
      <div className="flex flex-wrap gap-1">
        {a.distTags.map((t) => (
          <Badge key={t.tag} tone={t.tag === "latest" ? "success" : "info"}>
            @{t.tag}
          </Badge>
        ))}
      </div>
    ),
  },
  updatedCol,
];

/** The Registry list — shared by the `/registry` (API specs) and
 * `/registry/schemas` routes so the kind tabs navigate by path, not `?kind=`.
 * The always-visible FilterBar is driven by `?q=<SQL>` (namespace, format,
 * search) — the compiled query IS the shareable URL. */
export function RegistryListPage({
  kind,
  all,
}: {
  kind: EntryKind;
  all: RegistryEntry[];
}) {
  const [importOpen, setImportOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const navigate = useNavigate();

  // Namespaces present on entries — feeds the filter values + import picker.
  const entryNamespaces = [...new Set(all.map((a) => a.namespace))].sort();
  const nsKey = entryNamespaces.join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute on the namespace SET, not array identity
  const schema = useMemo(() => registryFilterSchema(entryNamespaces), [nsKey]);
  const filter = useUrlFilters(schema);

  const isSchema = kind === "schema";
  // The kind (api/schema) is a path/tab, not a filter — split, then query each.
  const apis = filter.run(all.filter((a) => a.kind === "api"));
  const schemas = filter.run(all.filter((a) => a.kind === "schema"));
  const base = all.filter((a) =>
    isSchema ? a.kind === "schema" : a.kind === "api",
  );

  // Preserve the active `?q=` when switching kind tabs.
  const nsRule = filter.rules.find((r) => r.key === "namespace");
  const defaultNamespace =
    nsRule?.values.length === 1 ? nsRule.values[0] : undefined;
  const qActive = filter.rules.length > 0 || filter.query.trim().length > 0;
  const nsQ = qActive ? `?q=${encodeURIComponent(filter.toQuery())}` : "";

  const importLabel = isSchema ? "Import schema" : "Import API";
  // Primary "Register API" is a disabled onboarding entry point (connecting the
  // workspace); importing a spec/schema is the working action, in the dropdown.
  const registerButton = (
    <ButtonGroup
      label="Register API"
      icon="plus"
      disabled
      title="Connect your workspace to register APIs directly — coming soon."
      linkComponent={RouterLink}
      items={[
        {
          key: "import",
          label: importLabel,
          icon: "plus",
          onSelect: () => setImportOpen(true),
        },
      ]}
    />
  );
  const importButton = (
    <Button variant="primary" icon="plus" onClick={() => setImportOpen(true)}>
      {importLabel}
    </Button>
  );
  // Onboarding CTA (empty registry) → the "how to create" chooser.
  const newApiButton = (
    <ButtonCTA
      variant="primary"
      icon="plus"
      onClick={() => setChoiceOpen(true)}
    >
      New {isSchema ? "schema" : "API"}
    </ButtonCTA>
  );

  return (
    <>
      <PageHeader
        title="Registry"
        // Empty registry → surface the working "New {API}" CTA in the header (the
        // "Register API" onboarding group is disabled, so it's no help yet). Once
        // entries exist, the onboarding group takes the header slot.
        actions={base.length === 0 ? newApiButton : registerButton}
        tabs={
          <Tabs
            linkComponent={RouterLink}
            activeKey={kind}
            items={[
              {
                key: "api",
                label: "API Specs",
                href: `/registry${nsQ}`,
                count: apis.length,
              },
              {
                key: "schema",
                label: "Schemas",
                href: `/registry/schemas${nsQ}`,
                count: schemas.length,
              },
            ]}
          />
        }
      />
      <LaTable
        filter={filter}
        data={base}
        columns={isSchema ? SCHEMA_COLUMNS : API_COLUMNS}
        getRowKey={(a) => a.id}
        rowHref={(a) => `/registry/${a.id}`}
        linkComponent={RouterLink}
        searchPlaceholder={isSchema ? "Search schemas…" : "Search APIs…"}
        empty={
          base.length === 0 ? (
            // Nothing registered yet → onboarding CTA (+ New API/schema).
            <EmptyState
              icon="registry"
              title={isSchema ? "No schemas yet" : "No APIs yet"}
              description={
                isSchema
                  ? "Import your first JSON Schema to get started."
                  : "Import your first OpenAPI, GraphQL, or AsyncAPI spec to get started."
              }
              action={newApiButton}
            />
          ) : (
            // Entries exist but the filters match none.
            <EmptyState
              icon="registry"
              title={isSchema ? "No schemas match" : "No APIs match"}
              description="Clear the filters above."
              action={importButton}
            />
          )
        }
      />
      <NewApiModal
        open={choiceOpen}
        onClose={() => setChoiceOpen(false)}
        onImport={() => {
          setChoiceOpen(false);
          setImportOpen(true);
        }}
        kind={kind}
      />
      <RegisterApiModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(api) => navigate(`/registry/${api.id}`)}
        kind={kind}
        namespaces={entryNamespaces}
        defaultNamespace={defaultNamespace}
      />
    </>
  );
}
