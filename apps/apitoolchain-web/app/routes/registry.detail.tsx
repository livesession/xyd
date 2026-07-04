import {
  Badge,
  Breadcrumb,
  Button,
  type Column,
  DescriptionList,
  Menu,
  Mono,
  PageHeader,
  StatusPill,
  Table,
  Tabs,
} from "@apitoolchain/design-system";
import { useState } from "react";
import { RouterLink } from "~/components/RouterLink";
import { SetDistTagModal } from "~/components/SetDistTagModal";
import {
  type ApiVersion,
  type DocsProject,
  getApi,
  listDocsProjects,
  listMcpServers,
  listSdkTargets,
  type McpServer,
  type SdkTarget,
  setDistTag,
} from "~/data";
import type { Route } from "./+types/registry.detail";
import { FORMAT } from "./registry";

export function meta() {
  return [{ title: "API — apitoolchain" }];
}

const TABS = ["overview", "versions", "sdks", "docs", "mcp"] as const;
type Tab = (typeof TABS)[number];

export async function loader({ params, request }: Route.LoaderArgs) {
  const api = await getApi(params.apiId);
  if (!api) throw new Response("Not Found", { status: 404 });
  // Schemas don't drive SDKs/docs/MCP — only overview + versions apply.
  const allowed: Tab[] =
    api.kind === "schema" ? ["overview", "versions"] : [...TABS];
  const requested = new URL(request.url).searchParams.get("tab") as Tab | null;
  const tab: Tab =
    requested && allowed.includes(requested) ? requested : "overview";
  const [sdks, docs, mcp] = await Promise.all([
    listSdkTargets(api.id),
    listDocsProjects(api.id),
    listMcpServers(api.id),
  ]);
  return { api, tab, sdks, docs, mcp };
}

export async function action({ params, request }: Route.ActionArgs) {
  const form = await request.formData();
  if (form.get("intent") === "set-dist-tag") {
    return setDistTag(
      params.apiId,
      String(form.get("tag") ?? ""),
      String(form.get("version") ?? ""),
    );
  }
  return { ok: false as const, message: "Unknown action" };
}

/** Coloured pills for a version's dist-tags (`latest` reads as success). */
function TagBadges({ tags }: { tags: string[] }) {
  if (!tags.length) return <span className="text-subtle">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <Badge key={t} tone={t === "latest" ? "success" : "info"}>
          @{t}
        </Badge>
      ))}
    </div>
  );
}

export default function RegistryDetailRoute({
  loaderData,
}: Route.ComponentProps) {
  const { api, tab, sdks, docs, mcp } = loaderData;
  const base = `/registry/${api.id}`;
  const isSchema = api.kind === "schema";
  const registryHref = isSchema ? "/registry?kind=schema" : "/registry";
  const current = api.versions.find((v) => v.current);
  const [tagOpen, setTagOpen] = useState(false);

  // version -> the dist-tags pointing at it
  const tagsByVersion = new Map<string, string[]>();
  for (const t of api.distTags) {
    tagsByVersion.set(t.version, [
      ...(tagsByVersion.get(t.version) ?? []),
      t.tag,
    ]);
  }

  const versionCols: Column<ApiVersion>[] = [
    {
      key: "version",
      header: "Version",
      width: "md",
      render: (v) => <span className="font-medium text-ink">v{v.version}</span>,
    },
    {
      key: "tags",
      header: "Dist-tags",
      width: "md",
      render: (v) => <TagBadges tags={tagsByVersion.get(v.version) ?? []} />,
    },
    {
      key: "specUrl",
      header: "Spec",
      width: "auto",
      render: (v) => <Mono tone="muted">{v.specUrl}</Mono>,
    },
    {
      key: "current",
      header: "State",
      width: "sm",
      render: (v) =>
        v.current ? (
          <Badge tone="success" dot>
            current
          </Badge>
        ) : (
          <Badge tone="neutral">archived</Badge>
        ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      width: "md",
      align: "right",
      render: (v) => <span className="text-subtle">{v.updatedAt}</span>,
    },
  ];

  const sdkCols: Column<SdkTarget>[] = [
    {
      key: "language",
      header: "Language",
      width: "md",
      render: (t) => (
        <Badge tone="neutral" icon="sdk">
          {t.language}
        </Badge>
      ),
    },
    {
      key: "packageName",
      header: "Package",
      width: "auto",
      render: (t) => <Mono>{t.packageName}</Mono>,
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      align: "right",
      render: (t) => <StatusPill status={t.status} />,
    },
  ];
  const docsCols: Column<DocsProject>[] = [
    {
      key: "name",
      header: "Name",
      width: "auto",
      render: (d) => <span className="font-medium text-ink">{d.name}</span>,
    },
    {
      key: "theme",
      header: "Theme",
      width: "sm",
      render: (d) => <Badge tone="neutral">{d.theme}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      align: "right",
      render: (d) => <StatusPill status={d.status} />,
    },
  ];
  const mcpCols: Column<McpServer>[] = [
    {
      key: "name",
      header: "Server",
      width: "auto",
      render: (m) => <Mono>{m.name}</Mono>,
    },
    {
      key: "toolsCount",
      header: "Tools",
      width: "xs",
      render: (m) => <Badge tone="neutral">{m.toolsCount}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      align: "right",
      render: (m) => <StatusPill status={m.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            linkComponent={RouterLink}
            items={[
              { label: "Registry", href: registryHref },
              { label: api.name },
            ]}
          />
        }
        title={api.name}
        description={api.description}
        actions={
          <>
            <Menu
              variant="select"
              label={`v${current?.version ?? "—"}`}
              items={api.versions.map((v) => ({
                key: v.version,
                label: `v${v.version}${v.current ? " · current" : ""}`,
                active: v.current,
              }))}
            />
            <Button
              variant="secondary"
              icon="plus"
              onClick={() => setTagOpen(true)}
            >
              Manage tags
            </Button>
            <Button variant="secondary" icon="externalLink">
              {isSchema ? "View schema" : "View spec"}
            </Button>
          </>
        }
        tabs={
          <Tabs
            linkComponent={RouterLink}
            activeKey={tab}
            items={[
              {
                key: "overview",
                label: "Overview",
                href: `${base}?tab=overview`,
              },
              {
                key: "versions",
                label: "Versions",
                href: `${base}?tab=versions`,
                count: api.versions.length,
              },
              ...(isSchema
                ? []
                : [
                    {
                      key: "sdks",
                      label: "SDKs",
                      href: `${base}?tab=sdks`,
                      count: sdks.length,
                    },
                    {
                      key: "docs",
                      label: "Docs",
                      href: `${base}?tab=docs`,
                      count: docs.length,
                    },
                    {
                      key: "mcp",
                      label: "MCP",
                      href: `${base}?tab=mcp`,
                      count: mcp.length,
                    },
                  ]),
            ]}
          />
        }
      />

      {tab === "overview" && (
        <DescriptionList
          items={[
            { label: "Format", value: FORMAT[api.format].label },
            { label: "Namespace", value: api.namespace },
            {
              label: "Repo",
              value: (
                <RouterLink
                  href="/settings/repos"
                  className="text-blue no-underline hover:underline"
                >
                  Connect a repo
                </RouterLink>
              ),
            },
            { label: "Current version", value: `v${current?.version ?? "—"}` },
            {
              label: "Dist-tags",
              value: <TagBadges tags={api.distTags.map((t) => t.tag)} />,
            },
            {
              label: "Registry URL",
              value: <Mono tone="muted">{api.registryUrl}</Mono>,
            },
            ...(isSchema
              ? []
              : [
                  { label: "SDK targets", value: String(api.sdkTargetCount) },
                  { label: "Docs sites", value: String(api.docsProjectCount) },
                  { label: "MCP servers", value: String(api.mcpServerCount) },
                ]),
            { label: "Last updated", value: api.updatedAt },
          ]}
        />
      )}

      {tab === "versions" && (
        <Table
          columns={versionCols}
          rows={api.versions}
          getRowKey={(v) => v.version}
        />
      )}
      {tab === "sdks" && (
        <Table columns={sdkCols} rows={sdks} getRowKey={(t) => t.id} />
      )}
      {tab === "docs" && (
        <Table columns={docsCols} rows={docs} getRowKey={(d) => d.id} />
      )}
      {tab === "mcp" && (
        <Table columns={mcpCols} rows={mcp} getRowKey={(m) => m.id} />
      )}

      <SetDistTagModal
        open={tagOpen}
        onClose={() => setTagOpen(false)}
        api={api}
      />
    </>
  );
}
