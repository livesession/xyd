import {
  Badge,
  Breadcrumb,
  Button,
  type Column,
  DescriptionList,
  Menu,
  Mono,
  PageHeader,
  RightPanel,
  RightPanelSection,
  StatusPill,
  Table,
  Tabs,
} from "@apitoolchain/design-system";
import { toQuery } from "@apitoolchain/filters";
import { useState } from "react";
import { useFetcher } from "react-router";
import { ConnectRepoModal } from "~/components/ConnectRepoModal";
import { GenerateSdkModal } from "~/components/GenerateSdkModal";
import { RegisterApiModal } from "~/components/RegisterApiModal";
import { FORMAT } from "~/components/RegistryListPage";
import { RouterLink } from "~/components/RouterLink";
import { SetDistTagModal } from "~/components/SetDistTagModal";
import {
  type ApiVersion,
  createRepoConnection,
  type DocsProject,
  type GitProvider,
  type GitProviderKind,
  getApi,
  listDocsProjects,
  listGitProviders,
  listMcpServers,
  listRepoConnections,
  listSdkTargets,
  type McpServer,
  type RepoConnection,
  removeRepoConnection,
  type SdkTarget,
  setDistTag,
  syncRepoConnection,
} from "~/data";
import { registryFilterSchema } from "~/data/filters";
import { formatVersion } from "~/version";
import type { Route } from "./+types/registry.detail";

export function meta() {
  return [{ title: "API — apitoolchain" }];
}

const TABS = ["overview", "versions", "sdks", "docs", "mcp"] as const;
type Tab = (typeof TABS)[number];

const REPO_HOST: Record<GitProviderKind, string> = {
  github: "https://github.com",
  gitlab: "https://gitlab.com",
  bitbucket: "https://bitbucket.org",
  gitea: "",
};

/** Web URL for a connected repo, from the provider's base URL (or default host). */
function repoWebUrl(
  provider: GitProvider | undefined,
  repo: string,
): string | undefined {
  const base = (provider?.baseUrl || (provider ? REPO_HOST[provider.kind] : ""))
    .trim()
    .replace(/\/+$/, "");
  return base ? `${base}/${repo}` : undefined;
}

export async function loader({ params }: Route.LoaderArgs) {
  const api = await getApi(params.apiId);
  if (!api) throw new Response("Not Found", { status: 404 });
  // Schemas don't drive SDKs/docs/MCP — only overview + versions apply.
  const allowed: Tab[] =
    api.kind === "schema" ? ["overview", "versions"] : [...TABS];
  const requested = params.tab as Tab | undefined;
  const tab: Tab =
    requested && allowed.includes(requested) ? requested : "overview";
  const [sdks, docs, mcp, providers, connections] = await Promise.all([
    listSdkTargets(api.id),
    listDocsProjects(api.id),
    listMcpServers(api.id),
    listGitProviders(),
    listRepoConnections("spec", api.id),
  ]);
  return { api, tab, sdks, docs, mcp, providers, connections };
}

export async function action({ params, request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "set-dist-tag") {
    return setDistTag(
      params.apiId,
      String(form.get("tag") ?? ""),
      String(form.get("version") ?? ""),
    );
  }
  if (intent === "connect-repo") {
    return createRepoConnection({
      providerId: String(form.get("providerId") ?? ""),
      targetKind: "spec",
      targetId: params.apiId,
      repo: String(form.get("repo") ?? ""),
      createRepo: form.get("createRepo") === "1",
      makePrivate: form.get("makePrivate") === "1",
      branch: String(form.get("branch") ?? "") || undefined,
      prefix: String(form.get("prefix") ?? ""),
    });
  }
  if (intent === "sync-repo") {
    return syncRepoConnection(String(form.get("id") ?? ""));
  }
  if (intent === "disconnect-repo") {
    return removeRepoConnection(String(form.get("id") ?? ""));
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
  const { api, tab, sdks, docs, mcp, providers, connections } = loaderData;
  const base = `/registry/${api.id}`;
  const isSchema = api.kind === "schema";
  const registryHref = isSchema ? "/registry/schemas" : "/registry";
  // Namespace breadcrumb → the registry list filtered by `?q=<SQL>`.
  const nsHref = `${registryHref}?q=${encodeURIComponent(
    toQuery(registryFilterSchema([api.namespace]), {
      query: "",
      rules: [{ key: "namespace", values: [api.namespace] }],
    }),
  )}`;
  const current = api.versions.find((v) => v.current);
  // The version filter inside Overview drives which version's details show.
  const [versionSel, setVersionSel] = useState(current?.version ?? "");
  const shownVersion =
    api.versions.find((v) => v.version === versionSel) ?? current;
  const [tagOpen, setTagOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const providerById = new Map(providers.map((p) => [p.id, p]));

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
      render: (v) => (
        <span className="font-medium text-ink">{formatVersion(v.version)}</span>
      ),
    },
    {
      key: "tags",
      header: "Dist-tag",
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
              { label: `@${api.namespace}`, href: nsHref },
              { label: api.name },
            ]}
          />
        }
        title={api.name}
        description={api.description}
        actions={
          <Button
            variant="secondary"
            icon="git"
            onClick={() => setConnectOpen(true)}
          >
            {connections.length ? "Connect another repo" : "Connect a repo"}
          </Button>
        }
        tabs={
          <Tabs
            linkComponent={RouterLink}
            activeKey={tab}
            items={[
              {
                key: "overview",
                label: "Overview",
                href: base,
              },
              {
                key: "versions",
                label: "Versions",
                href: `${base}/versions`,
                count: api.versions.length,
              },
              ...(isSchema
                ? []
                : [
                    {
                      key: "sdks",
                      label: "SDKs",
                      href: `${base}/sdks`,
                      count: sdks.length,
                    },
                    {
                      key: "docs",
                      label: "Docs",
                      href: `${base}/docs`,
                      count: docs.length,
                    },
                    {
                      key: "mcp",
                      label: "MCP",
                      href: `${base}/mcp`,
                      count: mcp.length,
                    },
                  ]),
            ]}
          />
        }
      />

      {/* Fill the viewport: -mt-6 meets the PageHeader's bottom border, -mb-16
          cancels the content padding so the panel border reaches the bottom. */}
      <div className="-mt-6 -mb-16 flex flex-1">
        <div className="min-w-0 flex-1 pt-6 pr-8 pb-16">
          {tab === "overview" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-subtle">Version</span>
                <Menu
                  variant="select"
                  icon="tags-outline"
                  label={formatVersion(shownVersion?.version)}
                  items={api.versions.map((v) => ({
                    key: v.version,
                    label: `${formatVersion(v.version)}${v.current ? " · current" : ""}`,
                    active: v.version === shownVersion?.version,
                    onSelect: () => setVersionSel(v.version),
                  }))}
                />
              </div>
              <DescriptionList
                items={[
                  { label: "Format", value: FORMAT[api.format].label },
                  { label: "Namespace", value: api.namespace },
                  {
                    label: "Dist-tag",
                    value: (
                      <TagBadges
                        tags={
                          tagsByVersion.get(shownVersion?.version ?? "") ?? []
                        }
                      />
                    ),
                  },
                  {
                    label: "Spec URL",
                    value: <Mono tone="muted">{shownVersion?.specUrl}</Mono>,
                  },
                  {
                    label: "Registry URL",
                    value: <Mono tone="muted">{api.registryUrl}</Mono>,
                  },
                  ...(isSchema
                    ? []
                    : [
                        {
                          label: "SDK targets",
                          value: String(api.sdkTargetCount),
                        },
                        {
                          label: "Docs sites",
                          value: String(api.docsProjectCount),
                        },
                        {
                          label: "MCP servers",
                          value: String(api.mcpServerCount),
                        },
                      ]),
                  {
                    label: "Last updated",
                    value: shownVersion?.updatedAt ?? api.updatedAt,
                  },
                ]}
              />
            </div>
          )}

          {tab === "versions" && (
            <Table
              columns={versionCols}
              rows={api.versions}
              getRowKey={(v) => v.version}
            />
          )}
          {tab === "sdks" && (
            <Table
              columns={sdkCols}
              rows={sdks}
              getRowKey={(t) => t.id}
              rowHref={(t) => `/sdks/${t.sdkId}/targets/${t.id}`}
              linkComponent={RouterLink}
            />
          )}
          {tab === "docs" && (
            <Table columns={docsCols} rows={docs} getRowKey={(d) => d.id} />
          )}
          {tab === "mcp" && (
            <Table columns={mcpCols} rows={mcp} getRowKey={(m) => m.id} />
          )}
        </div>

        <RightPanel placement="content-right">
          <RightPanelSection title="Actions">
            <Button
              variant="secondary"
              icon="plus"
              onClick={() => setImportOpen(true)}
              disabled={api.versions.length === 0}
            >
              New version
            </Button>
            {!isSchema && (
              <Button
                variant="secondary"
                icon="sdk"
                onClick={() => setGenOpen(true)}
              >
                Generate SDKs
              </Button>
            )}
            <Button
              variant="secondary"
              icon="tags-outline"
              onClick={() => setTagOpen(true)}
            >
              Manage dist-tags
            </Button>
            <Button
              variant="secondary"
              icon={isSchema ? "externalLink" : "download"}
              href={api.registryUrl}
            >
              {isSchema ? "View schema" : "Download spec"}
            </Button>
          </RightPanelSection>

          <RightPanelSection title="Repository">
            {connections.length ? (
              connections.map((c) => (
                <RepoConnectionRow
                  key={c.id}
                  conn={c}
                  href={repoWebUrl(providerById.get(c.providerId), c.repo)}
                />
              ))
            ) : (
              <p className="text-[13px] text-subtle">
                No repositories connected. Use “Connect a repo” above.
              </p>
            )}
          </RightPanelSection>

          <RightPanelSection title="At a glance">
            <div className="flex flex-col divide-y divide-line-soft rounded-control border border-line bg-surface text-sm">
              <Glance
                label="Current version"
                value={formatVersion(current?.version)}
              />
              <Glance label="Dist-tags" value={String(api.distTags.length)} />
              <Glance label="Versions" value={String(api.versions.length)} />
              {!isSchema && (
                <>
                  <Glance
                    label="SDK targets"
                    value={String(api.sdkTargetCount)}
                  />
                  <Glance
                    label="Docs sites"
                    value={String(api.docsProjectCount)}
                  />
                  <Glance
                    label="MCP servers"
                    value={String(api.mcpServerCount)}
                  />
                </>
              )}
            </div>
          </RightPanelSection>
        </RightPanel>
      </div>

      <SetDistTagModal
        open={tagOpen}
        onClose={() => setTagOpen(false)}
        api={api}
      />
      <RegisterApiModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        kind={api.kind}
        newVersion={{
          name: api.name,
          namespace: api.namespace,
          format: api.format,
        }}
      />
      {!isSchema && (
        <GenerateSdkModal
          open={genOpen}
          onClose={() => setGenOpen(false)}
          apis={[api]}
          lockedApiId={api.id}
        />
      )}
      <ConnectRepoModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        providers={providers}
        actionPath={base}
      />
    </>
  );
}

/** One repo connection in the RightPanel: repo + sync status + Sync/Remove. */
function RepoConnectionRow({
  conn,
  href,
}: {
  conn: RepoConnection;
  href?: string;
}) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const status = busy ? "building" : (conn.lastSyncStatus ?? "draft");
  return (
    <div className="flex flex-col gap-2 rounded-control border border-line bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 truncate font-mono text-[13px] text-blue no-underline hover:underline"
          >
            {conn.repo}
          </a>
        ) : (
          <Mono tone="muted">{conn.repo}</Mono>
        )}
        <StatusPill status={status} />
      </div>
      <div className="flex items-center gap-1.5">
        <fetcher.Form method="post" className="contents">
          <input type="hidden" name="intent" value="sync-repo" />
          <input type="hidden" name="id" value={conn.id} />
          <Button
            variant="secondary"
            size="sm"
            icon="git"
            type="submit"
            disabled={busy}
          >
            {busy ? "Syncing…" : "Sync"}
          </Button>
        </fetcher.Form>
        <fetcher.Form method="post" className="contents">
          <input type="hidden" name="intent" value="disconnect-repo" />
          <input type="hidden" name="id" value={conn.id} />
          <Button variant="ghost" size="sm" type="submit" disabled={busy}>
            Remove
          </Button>
        </fetcher.Form>
      </div>
    </div>
  );
}

function Glance({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <span className="text-subtle">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
