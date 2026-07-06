import {
  Badge,
  Breadcrumb,
  Button,
  ButtonGroup,
  type Column,
  DescriptionList,
  DropdownMenu,
  type DropdownMenuItem,
  EmptyState,
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
import { ConnectRepoModal, KIND_ICON } from "~/components/ConnectRepoModal";
import { GenerateSdkModal } from "~/components/GenerateSdkModal";
import { RegisterApiModal } from "~/components/RegisterApiModal";
import { FORMAT } from "~/components/RegistryListPage";
import {
  RepositoryReleases,
  RepositorySettings,
} from "~/components/RepositoryModal";
import { RouterLink } from "~/components/RouterLink";
import { SetDistTagModal } from "~/components/SetDistTagModal";
import {
  type ApiVersion,
  createRepoConnection,
  type DocsProject,
  type GitProvider,
  getApi,
  listDocsProjects,
  listGitProviders,
  listMcpServers,
  listRepoConnections,
  listSdkTargets,
  loadReleasesByConn,
  type McpServer,
  prepareRelease,
  publishRelease,
  type RepoConnection,
  removeRepoConnection,
  type SdkTarget,
  setDistTag,
  setReleaseConfig,
  syncRepoConnection,
} from "~/data";
import { registryFilterSchema } from "~/data/filters";
import { repoWebUrl } from "~/lib/repoUrl";
import { formatVersion } from "~/version";
import type { Route } from "./+types/registry.detail";

export function meta() {
  return [{ title: "API — apitoolchain" }];
}

const TABS = [
  "overview",
  "versions",
  "sdks",
  "docs",
  "mcp",
  "releases",
  "repository",
] as const;
type Tab = (typeof TABS)[number];

export async function loader({ params }: Route.LoaderArgs) {
  const api = await getApi(params.apiId);
  if (!api) throw new Response("Not Found", { status: 404 });
  // Schemas don't drive SDKs/docs/MCP — only overview + versions apply.
  const allowed: Tab[] =
    api.kind === "schema"
      ? ["overview", "versions", "releases", "repository"]
      : [...TABS];
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
  const releasesByConn = await loadReleasesByConn(connections);
  return { api, tab, sdks, docs, mcp, providers, connections, releasesByConn };
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
      releaseMode: String(form.get("releaseMode") ?? "") || undefined,
      autoRelease: form.get("autoRelease") === "1",
    });
  }
  if (intent === "release-config") {
    return setReleaseConfig(String(form.get("id") ?? ""), {
      releaseMode: String(form.get("releaseMode") ?? "push"),
      autoRelease: form.get("autoRelease") === "1",
      baseBranch: String(form.get("baseBranch") ?? "") || undefined,
      prerelease: form.get("prerelease") === "1",
    });
  }
  if (intent === "prepare-release") {
    return prepareRelease({ connectionId: String(form.get("id") ?? "") });
  }
  if (intent === "publish-release") {
    return publishRelease(String(form.get("id") ?? ""));
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
  const { api, tab, sdks, docs, mcp, providers, connections, releasesByConn } =
    loaderData;
  const providerById = new Map(providers.map((p) => [p.id, p]));
  // Total releases across every connection — drives the Releases tab count.
  const releaseCount = connections.reduce(
    (n, c) => n + (releasesByConn[c.id]?.length ?? 0),
    0,
  );
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

  // Utility actions live behind the Actions section's hover "more" menu, so the
  // panel body keeps only the primary create actions.
  const moreActionItems: DropdownMenuItem[] = [
    {
      key: "dist-tags",
      label: "Manage dist-tags",
      icon: "tags-outline",
      onSelect: () => setTagOpen(true),
    },
    {
      key: "spec",
      label: isSchema ? "View schema" : "Download spec",
      icon: isSchema ? "externalLink" : "download",
      href: api.registryUrl,
    },
  ];
  if (connections.length > 0) {
    moreActionItems.push({
      key: "connect",
      label: "Connect another repo",
      icon: "git",
      onSelect: () => setConnectOpen(true),
    });
  }

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
          connections.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {connections.map((c) => (
                <RepoButton
                  key={c.id}
                  conn={c}
                  provider={providerById.get(c.providerId)}
                  base={base}
                />
              ))}
            </div>
          ) : (
            <Button
              variant="secondary"
              icon="git"
              onClick={() => setConnectOpen(true)}
            >
              Connect a repo
            </Button>
          )
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
              {
                key: "releases",
                label: "Releases",
                href: `${base}/releases`,
                count: releaseCount,
              },
              {
                key: "repository",
                label: "Repository",
                href: `${base}/repository`,
                count: connections.length,
              },
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
          {tab === "releases" &&
            (connections.length === 0 ? (
              <EmptyState
                icon="bolt"
                title="No releases yet"
                description="Connect a git repo on release mode to open versioned release PRs."
                action={
                  <Button
                    variant="secondary"
                    icon="git"
                    onClick={() => setConnectOpen(true)}
                  >
                    Connect repo
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col gap-6">
                {connections.map((c) => (
                  <RepositoryReleases
                    key={c.id}
                    connection={c}
                    releases={releasesByConn[c.id] ?? []}
                    actionPath={base}
                  />
                ))}
              </div>
            ))}
          {tab === "repository" &&
            (connections.length === 0 ? (
              <EmptyState
                icon="git"
                title="No repositories connected"
                description="Connect a git repo to sync this spec or open release PRs."
                action={
                  <Button
                    variant="secondary"
                    icon="git"
                    onClick={() => setConnectOpen(true)}
                  >
                    Connect repo
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col gap-6">
                {connections.map((c) => (
                  <RepositorySettings
                    key={c.id}
                    connection={c}
                    actionPath={base}
                  />
                ))}
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="git"
                    onClick={() => setConnectOpen(true)}
                  >
                    Connect another repo
                  </Button>
                </div>
              </div>
            ))}
        </div>

        <RightPanel placement="content-right">
          {/* Primary create actions stay in the body; utility actions (dist-tags,
              download, connect-another) live in the title's hover "more" menu. */}
          <RightPanelSection
            title="Actions"
            action={
              <DropdownMenu
                align="right"
                items={moreActionItems}
                trigger={
                  <Button variant="ghost" size="sm" icon="more">
                    <span className="sr-only">More actions</span>
                  </Button>
                }
              />
            }
          >
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
        targetKind="spec"
      />
    </>
  );
}

/** A per-connection card — repo name + release/sync status, then its content. */
/**
 * The connected repo as a page-header split button: the repo (with its git
 * provider's brand icon) opens the repo on the provider; the caret drops down to
 * the Releases / Settings tabs.
 */
function RepoButton({
  conn,
  provider,
  base,
}: {
  conn: RepoConnection;
  provider?: GitProvider;
  base: string;
}) {
  const url = provider ? repoWebUrl(provider, conn.repo) : undefined;
  return (
    <ButtonGroup
      variant="secondary"
      icon={provider ? KIND_ICON[provider.kind] : "git"}
      label={conn.repo}
      title={url ? `Open ${conn.repo}` : conn.repo}
      onClick={
        url
          ? () => window.open(url, "_blank", "noopener,noreferrer")
          : undefined
      }
      linkComponent={RouterLink}
      items={[
        {
          key: "releases",
          label: "Releases",
          icon: "bolt",
          href: `${base}/releases`,
        },
        {
          key: "settings",
          label: "Settings",
          icon: "settings",
          href: `${base}/repository`,
        },
      ]}
    />
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
