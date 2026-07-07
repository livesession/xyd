import {
  Badge,
  Breadcrumb,
  Button,
  DropdownMenu,
  type DropdownMenuItem,
  PageHeader,
  RightPanel,
  RightPanelSection,
  Tabs,
} from "@apitoolchain/design-system";
import { toQuery } from "@apitoolchain/filters";
import { type ReactNode, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { ConnectRepoModal, KIND_ICON } from "~/components/ConnectRepoModal";
import { GenerateSdkModal } from "~/components/GenerateSdkModal";
import { RegisterApiModal } from "~/components/RegisterApiModal";
import { RouterLink } from "~/components/RouterLink";
import type { RegistryDetailContext } from "~/components/registryDetailShared";
import { SetDistTagModal } from "~/components/SetDistTagModal";
import {
  getApi,
  listDocsProjects,
  listGitProviders,
  listMcpServers,
  listRepoConnections,
  listSdkTargets,
  loadReleasesByConn,
} from "~/data";
import { registryFilterSchema } from "~/data/filters";
import { useRevalidateOnFocus } from "~/hooks/useRevalidateOnFocus";
import { repoWebUrl } from "~/lib/repoUrl";
import { formatVersion } from "~/version";
import type { Route } from "./+types/registry.$apiId";

export function meta() {
  return [{ title: "API — apitoolchain" }];
}

// Forms/modals post to the layout path (`base`); expose the shared action here
// so those submissions resolve, in addition to each tab route re-exporting it.
export { registryDetailAction as action } from "~/lib/registryDetailAction";

export async function loader({ params }: Route.LoaderArgs) {
  const api = await getApi(params.apiId);
  if (!api) throw new Response("Not Found", { status: 404 });
  const [sdks, docs, mcp, providers, connections] = await Promise.all([
    listSdkTargets(api.id),
    listDocsProjects(api.id),
    listMcpServers(api.id),
    listGitProviders(),
    listRepoConnections("spec", api.id),
  ]);
  const releasesByConn = await loadReleasesByConn(connections);
  return { api, sdks, docs, mcp, providers, connections, releasesByConn };
}

/**
 * A compact, clickable repo-sync chip for the PageHeader title — a toned Badge
 * that links to the Releases tab. Warning = PRs to merge / behind; success =
 * in sync. Replaces the old full-width "repo is behind" banner.
 */
function SyncChip({
  tone,
  label,
  title,
  href,
}: {
  tone: "warning" | "success";
  label: string;
  title: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      title={title}
      className="rounded-pill no-underline transition-opacity hover:opacity-80"
    >
      <Badge tone={tone} icon="git">
        {label}
      </Badge>
    </Link>
  );
}

/**
 * The registry-detail layout: PageHeader (breadcrumb, title, sync chip, tabs) +
 * a right-side Actions/At-a-glance panel + the shared modals. Each tab is its
 * own route file rendered through `<Outlet>`; they read shared data via the
 * `RegistryDetailContext` outlet context.
 */
export default function RegistryDetailLayout({
  loaderData,
}: Route.ComponentProps) {
  const { api, sdks, docs, mcp, providers, connections, releasesByConn } =
    loaderData;
  const providerById = new Map(providers.map((p) => [p.id, p]));
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
  // Repo-sync summary → a compact chip beside the title.
  const specVersion = current?.version ?? "";
  const openPrs = connections.flatMap((c) =>
    (releasesByConn[c.id] ?? []).filter((r) => r.state === "pr_open"),
  );
  // Release-mode repos whose released version isn't the current spec — this
  // includes a freshly-connected repo that has never released. With no open PR
  // yet, a release is (being) prepared, so the repo is NOT "in sync" (avoids the
  // green "In sync" that flips to "N PRs to merge" once the auto-opened PR lands).
  const pendingRelease = connections.filter(
    (c) =>
      c.releaseMode === "release" &&
      !!specVersion &&
      c.lastReleasedVersion !== specVersion,
  );
  const behindNoPr = openPrs.length === 0 && pendingRelease.length > 0;
  // Never released (just connected) → "preparing"; released older → "behind".
  const preparing =
    behindNoPr && pendingRelease.every((c) => !c.lastReleasedVersion);
  // While the repo sync is unsettled (a release is preparing, PRs are open, or a
  // sync is building), re-check on tab focus so the chip updates without a manual
  // refresh — the initial PR is opened asynchronously after connecting.
  const syncUnsettled =
    openPrs.length > 0 ||
    behindNoPr ||
    connections.some((c) => c.lastSyncStatus === "building");
  useRevalidateOnFocus(syncUnsettled);
  const releasesHref = `${base}/releases`;
  let syncChip: ReactNode = null;
  if (openPrs.length > 0) {
    const n = openPrs.length;
    syncChip = (
      <SyncChip
        tone="warning"
        label={`${n} PR${n === 1 ? "" : "s"} to merge`}
        title="Release PRs waiting to merge — review to sync the repo"
        href={releasesHref}
      />
    );
  } else if (behindNoPr) {
    syncChip = (
      <SyncChip
        tone="warning"
        label={preparing ? "Preparing release" : "Behind"}
        title={
          preparing
            ? "Setting up the first release PR for this repo"
            : "Repo trails the current spec — open a release to sync"
        }
        href={releasesHref}
      />
    );
  } else if (connections.length > 0) {
    syncChip = (
      <SyncChip
        tone="success"
        label="In sync"
        title="Repo is up to date with the current spec"
        href={releasesHref}
      />
    );
  }

  const [tagOpen, setTagOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  // Utility actions live behind the Actions section's hover "more" menu.
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

  // version -> the dist-tags pointing at it (shared with the tab routes).
  const tagsByVersion = new Map<string, string[]>();
  for (const t of api.distTags) {
    tagsByVersion.set(t.version, [
      ...(tagsByVersion.get(t.version) ?? []),
      t.tag,
    ]);
  }

  // The active tab drives the Tabs highlight — derived from the URL, since the
  // tab content is a nested route (not local state).
  const { pathname } = useLocation();
  const activeTab =
    pathname.slice(base.length).replace(/^\/+/, "").split("/")[0] || "overview";

  const ctx: RegistryDetailContext = {
    api,
    isSchema,
    base,
    sdks,
    docs,
    mcp,
    connections,
    releasesByConn,
    tagsByVersion,
    openConnect: () => setConnectOpen(true),
    openGen: () => setGenOpen(true),
  };

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
        leadingActions={syncChip}
        tabs={
          <Tabs
            linkComponent={RouterLink}
            activeKey={activeTab}
            items={[
              { key: "overview", label: "Overview", href: base },
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
          <Outlet context={ctx} />
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
            {!isSchema && (
              <Button
                variant="secondary"
                icon="docs"
                href={`/editor/${api.id}`}
                newTab
              >
                Open editor ↗
              </Button>
            )}
            {/* Repo connections live at the bottom of Actions: "Connect a repo"
                before any exist, then the connected repo(s) as plain buttons. */}
            {connections.length === 0 ? (
              <Button
                variant="secondary"
                icon="git"
                onClick={() => setConnectOpen(true)}
              >
                Connect a repo
              </Button>
            ) : (
              connections.map((c) => {
                const provider = providerById.get(c.providerId);
                const url = provider ? repoWebUrl(provider, c.repo) : undefined;
                return (
                  <Button
                    key={c.id}
                    variant="secondary"
                    icon={provider ? KIND_ICON[provider.kind] : "git"}
                    onClick={
                      url
                        ? () =>
                            window.open(url, "_blank", "noopener,noreferrer")
                        : undefined
                    }
                  >
                    {c.repo}
                  </Button>
                );
              })
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
          id: api.id,
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

function Glance({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <span className="text-subtle">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
