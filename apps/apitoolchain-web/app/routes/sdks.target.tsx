import {
  Badge,
  Breadcrumb,
  Button,
  Callout,
  type Column,
  DescriptionList,
  EmptyState,
  Link,
  Menu,
  Mono,
  PageHeader,
  RightPanel,
  RightPanelSection,
  StatusPill,
  Table,
  Tabs,
} from "@apitoolchain/design-system";
import { useState } from "react";
import { redirect, useFetcher } from "react-router";
import { ConnectRepoModal } from "~/components/ConnectRepoModal";
import { ReleaseSettingsModal } from "~/components/ReleaseSettingsModal";
import { ReleasesModal } from "~/components/ReleasesModal";
import { RouterLink } from "~/components/RouterLink";
import { SDK_LANG_LABEL, SdkLangIcon } from "~/components/SdkLangIcon";
import {
  createRepoConnection,
  deleteSdkTarget,
  deriveTargetVersions,
  type GitProvider,
  getApi,
  getSdk,
  getSdkTarget,
  listGitProviders,
  listRepoConnections,
  listTargetVersions,
  loadReleasesByConn,
  prepareRelease,
  publishRelease,
  type Release,
  type RepoConnection,
  removeRepoConnection,
  type SdkLanguage,
  setReleaseConfig,
  syncRepoConnection,
  type TargetVersion,
} from "~/data";
import { repoWebUrl } from "~/lib/repoUrl";
import { formatVersion } from "~/version";
import type { Route } from "./+types/sdks.target";

export function meta() {
  return [{ title: "SDK target — apitoolchain" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const target = await getSdkTarget(params.targetId);
  if (!target) throw new Response("Not Found", { status: 404 });
  const [sdk, api, providers, connections, rawVersions] = await Promise.all([
    getSdk(params.sdkId),
    getApi(target.apiId),
    listGitProviders(),
    listRepoConnections("sdk", target.id),
    listTargetVersions(target.id),
  ]);
  const releasesByConn = await loadReleasesByConn(connections);
  const versions = deriveTargetVersions(
    target,
    api?.versions ?? [],
    rawVersions,
  );
  return {
    target,
    sdkId: params.sdkId,
    sdkName: sdk?.name ?? "SDK",
    apiName: api?.name ?? target.apiId,
    providers,
    connections,
    releasesByConn,
    versions,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    const res = await deleteSdkTarget(params.targetId);
    if (res.ok) return redirect(`/sdks/${params.sdkId}`);
    return { ok: false as const, message: res.message ?? "Delete failed." };
  }
  if (intent === "connect-repo") {
    return createRepoConnection({
      providerId: String(form.get("providerId") ?? ""),
      targetKind: "sdk",
      targetId: params.targetId,
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

function installCmd(language: SdkLanguage, pkg: string): string {
  switch (language) {
    case "node":
      return `npm install ${pkg}`;
    case "python":
      return `pip install ${pkg}`;
    case "go":
      return `go get ${pkg}`;
    case "ruby":
      return `gem install ${pkg}`;
    case "java":
      return `implementation "${pkg}"`;
    case "dotnet":
      return `dotnet add package ${pkg}`;
  }
}

type TargetTab = "overview" | "versions" | "repository";

export default function SdkTargetRoute({ loaderData }: Route.ComponentProps) {
  const {
    target,
    sdkId,
    sdkName,
    apiName,
    providers,
    connections,
    releasesByConn,
    versions,
  } = loaderData;
  const label = SDK_LANG_LABEL[target.language];
  const ready = target.status === "ready";
  const title = target.packageName || `${label} SDK`;
  const actionPath = `/sdks/${sdkId}/targets/${target.id}`;
  const [tab, setTab] = useState<TargetTab>("overview");
  const [connectOpen, setConnectOpen] = useState(false);
  // Version selector on Overview — pick which build's details to show.
  const [versionSel, setVersionSel] = useState(
    versions[0]?.version ?? target.version,
  );
  const shownVersion =
    versions.find((v) => v.version === versionSel) ?? versions[0];

  const versionCols: Column<TargetVersion>[] = [
    {
      key: "version",
      header: "Version",
      width: "md",
      render: (v) => (
        <span className="font-medium text-ink">{formatVersion(v.version)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      render: (v) => <StatusPill status={v.status} />,
    },
    {
      key: "published",
      header: "Published",
      width: "md",
      render: (v) => (
        <span className="text-subtle">{v.publishedAt || "Not published"}</span>
      ),
    },
    {
      key: "registry",
      header: "Registry",
      width: "auto",
      render: (v) =>
        v.registryUrl ? (
          <Mono tone="muted">{v.registryUrl}</Mono>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
  ];

  const del = useFetcher();
  const deleting = del.state !== "idle";
  const delError = (del.data as { message?: string } | undefined)?.message;

  function onDelete() {
    if (
      !window.confirm(`Delete the ${label} target? This can't be undone.`) ||
      deleting
    )
      return;
    del.submit({ intent: "delete" }, { method: "post", action: actionPath });
  }

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            linkComponent={RouterLink}
            items={[
              { label: "SDKs", href: "/sdks" },
              { label: sdkName, href: `/sdks/${sdkId}` },
              { label },
            ]}
          />
        }
        title={title}
        description={`The ${label} target of ${sdkName}.`}
        tabs={
          <Tabs
            activeKey={tab}
            onChange={(k) => setTab(k as TargetTab)}
            items={[
              { key: "overview", label: "Overview" },
              { key: "versions", label: "Versions", count: versions.length },
              {
                key: "repository",
                label: "Repository",
                count: connections.length,
              },
            ]}
          />
        }
        actions={<StatusPill status={target.status} />}
      />

      {/* Fill the viewport: -mt-6 meets the PageHeader's bottom border, -mb-16
          cancels the content padding so the panel border reaches the bottom. */}
      <div className="-mt-6 -mb-16 flex flex-1">
        <div className="min-w-0 flex-1 pt-6 pr-8 pb-16">
          {delError && (
            <div className="mb-4">
              <Callout tone="error">{delError}</Callout>
            </div>
          )}

          {tab === "overview" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-subtle">Version</span>
                <Menu
                  variant="select"
                  icon="tags-outline"
                  label={formatVersion(shownVersion?.version)}
                  items={versions.map((v) => ({
                    key: v.version,
                    label: formatVersion(v.version),
                    active: v.version === shownVersion?.version,
                    onSelect: () => setVersionSel(v.version),
                  }))}
                />
              </div>
              <DescriptionList
                items={[
                  {
                    label: "Language",
                    value: (
                      <span className="inline-flex items-center gap-2 font-medium text-ink">
                        <SdkLangIcon
                          language={target.language}
                          className="size-4 shrink-0"
                        />
                        {label}
                      </span>
                    ),
                  },
                  {
                    label: "Package",
                    value: <Mono>{target.packageName || "—"}</Mono>,
                  },
                  {
                    label: "Version",
                    value: formatVersion(
                      shownVersion?.version ?? target.version,
                    ),
                  },
                  {
                    label: "Output",
                    value: <Mono tone="muted">{target.output}</Mono>,
                  },
                  {
                    label: "API",
                    value: (
                      <RouterLink
                        href={`/registry/${target.apiId}`}
                        className="text-blue no-underline hover:underline"
                      >
                        {apiName}
                      </RouterLink>
                    ),
                  },
                  {
                    label: "Published",
                    value: shownVersion?.publishedAt ?? "Not published",
                  },
                  ...(shownVersion?.registryUrl
                    ? [
                        {
                          label: "Registry",
                          value: (
                            <Mono tone="muted">{shownVersion.registryUrl}</Mono>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
              {ready && (
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-semibold text-ink">Install</div>
                  <div className="rounded-control border border-line bg-surface-muted px-3 py-2.5">
                    <Mono>
                      {installCmd(target.language, target.packageName || label)}
                    </Mono>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "versions" && (
            <Table
              columns={versionCols}
              rows={versions}
              getRowKey={(v) => v.id}
            />
          )}

          {tab === "repository" &&
            (connections.length === 0 ? (
              <EmptyState
                icon="git"
                title="No repositories connected"
                description={`Push the generated ${label} SDK into a connected git repo.`}
                action={
                  <Button
                    variant="secondary"
                    icon="git"
                    onClick={() => setConnectOpen(true)}
                    disabled={!ready}
                  >
                    Connect repo
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                {connections.map((c) => (
                  <TargetRepoRow
                    key={c.id}
                    conn={c}
                    actionPath={actionPath}
                    providers={providers}
                    releases={releasesByConn[c.id] ?? []}
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
          <RightPanelSection title="Actions">
            {ready && (
              <Button
                variant="secondary"
                icon="download"
                href={`${actionPath}/download`}
              >
                Download
              </Button>
            )}
            <Button
              variant="secondary"
              icon="git"
              onClick={() => setConnectOpen(true)}
            >
              {connections.length ? "Connect another repo" : "Connect repo"}
            </Button>
            <Button variant="ghost" onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete target"}
            </Button>
          </RightPanelSection>

          <RightPanelSection title="At a glance">
            <div className="flex flex-col divide-y divide-line-soft rounded-control border border-line bg-surface text-sm">
              <Glance label="Language" value={label} />
              <Glance label="Version" value={formatVersion(target.version)} />
              <Glance label="Package" value={target.packageName || "—"} />
              <Glance
                label="Published"
                value={target.lastPublishedAt ? "Yes" : "No"}
              />
              <Glance label="Repositories" value={String(connections.length)} />
            </div>
          </RightPanelSection>
        </RightPanel>
      </div>

      <ConnectRepoModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        providers={providers}
        actionPath={actionPath}
        targetKind="sdk"
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

/** One repo connection on the SDK target page: repo + status + Sync/Remove. */
function TargetRepoRow({
  conn,
  actionPath,
  providers,
  releases,
}: {
  conn: RepoConnection;
  actionPath: string;
  providers: GitProvider[];
  releases: Release[];
}) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const status = busy ? "building" : (conn.lastSyncStatus ?? "draft");
  const release = conn.releaseMode === "release";
  const [cfgOpen, setCfgOpen] = useState(false);
  const [relOpen, setRelOpen] = useState(false);
  const href = repoWebUrl(
    providers.find((p) => p.id === conn.providerId),
    conn.repo,
  );
  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {href ? (
          <Link href={href} mono>
            {conn.repo}
          </Link>
        ) : (
          <Mono>{conn.repo}</Mono>
        )}
        {release ? (
          <Badge tone="info">release</Badge>
        ) : (
          <StatusPill status={status} />
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {release ? (
          <Button
            variant="ghost"
            size="sm"
            icon="bolt"
            onClick={() => setRelOpen(true)}
          >
            Releases
          </Button>
        ) : (
          <fetcher.Form method="post" action={actionPath} className="contents">
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
        )}
        <Button
          variant="ghost"
          size="sm"
          icon="settings"
          onClick={() => setCfgOpen(true)}
        >
          Settings
        </Button>
        <fetcher.Form method="post" action={actionPath} className="contents">
          <input type="hidden" name="intent" value="disconnect-repo" />
          <input type="hidden" name="id" value={conn.id} />
          <Button variant="ghost" size="sm" type="submit" disabled={busy}>
            Remove
          </Button>
        </fetcher.Form>
      </div>
      <ReleaseSettingsModal
        open={cfgOpen}
        onClose={() => setCfgOpen(false)}
        connection={conn}
        actionPath={actionPath}
      />
      <ReleasesModal
        open={relOpen}
        onClose={() => setRelOpen(false)}
        connection={conn}
        releases={releases}
        actionPath={actionPath}
      />
    </div>
  );
}
