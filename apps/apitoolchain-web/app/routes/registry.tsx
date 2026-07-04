import {
  Badge,
  type BadgeTone,
  Button,
  ButtonGroup,
  type Column,
  EmptyState,
  PageHeader,
  Table,
  Tabs,
} from "@apitoolchain/design-system";
import { useState } from "react";
import { RegisterApiModal } from "~/components/RegisterApiModal";
import { RouterLink } from "~/components/RouterLink";
import {
  type ApiFormat,
  type EntryKind,
  listApis,
  type RegisterApiInput,
  type RegistryEntry,
  registerApi,
} from "~/data";
import type { Route } from "./+types/registry";

export function meta() {
  return [
    { title: "Registry — apitoolchain" },
    { name: "description", content: "Registered API specs and schemas" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const all = await listApis();
  const kind: EntryKind =
    new URL(request.url).searchParams.get("kind") === "schema"
      ? "schema"
      : "api";
  return { all, kind };
}

export async function action({ request }: { request: Request }) {
  const form = await request.formData();
  const str = (k: string) => String(form.get(k) ?? "").trim();
  const name = str("name");
  if (!name) return { ok: false as const, message: "Name is required." };
  const input: RegisterApiInput = {
    name,
    ns: str("ns") || undefined,
    kind: str("kind") === "schema" ? "schema" : "api",
    format: (str("format") || undefined) as RegisterApiInput["format"],
    specText: String(form.get("specText") ?? "") || undefined,
    url: str("url") || undefined,
  };
  return registerApi(input);
}

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
  render: (a) => `v${a.versions.find((v) => v.current)?.version ?? "—"}`,
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
    header: "Dist-tags",
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

export default function RegistryRoute({ loaderData }: Route.ComponentProps) {
  const { all, kind } = loaderData;
  const [importOpen, setImportOpen] = useState(false);

  const apis = all.filter((a) => a.kind === "api");
  const schemas = all.filter((a) => a.kind === "schema");
  const isSchema = kind === "schema";
  const rows = isSchema ? schemas : apis;

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

  return (
    <>
      <PageHeader
        title="Registry"
        description="Every API spec and schema you've registered — versioned, tagged, and ready to ship SDKs, docs, and MCP servers from."
        actions={registerButton}
        tabs={
          <Tabs
            linkComponent={RouterLink}
            activeKey={kind}
            items={[
              {
                key: "api",
                label: "API Specs",
                href: "/registry",
                count: apis.length,
              },
              {
                key: "schema",
                label: "Schemas",
                href: "/registry?kind=schema",
                count: schemas.length,
              },
            ]}
          />
        }
      />
      <Table
        columns={isSchema ? SCHEMA_COLUMNS : API_COLUMNS}
        rows={rows}
        getRowKey={(a) => a.id}
        rowHref={(a) => `/registry/${a.id}`}
        linkComponent={RouterLink}
        empty={
          <EmptyState
            icon="registry"
            title={
              isSchema ? "No schemas imported yet" : "No APIs imported yet"
            }
            description={
              isSchema
                ? "Import a standalone JSON Schema to reference it across your APIs."
                : "Import your first OpenAPI, GraphQL, or AsyncAPI spec to get started."
            }
            action={importButton}
          />
        }
      />
      <RegisterApiModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        kind={kind}
      />
    </>
  );
}
