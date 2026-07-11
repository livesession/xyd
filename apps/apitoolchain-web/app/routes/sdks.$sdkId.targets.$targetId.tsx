import {
  Breadcrumb,
  Button,
  ButtonCTA,
  DropdownMenu,
  type DropdownMenuItem,
  PageHeader,
  RightPanel,
  RightPanelSection,
  StatusPill,
  Tabs,
} from "@apitoolchain/design-system";
import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { ConnectRegistryModal } from "~/components/ConnectRegistryModal";
import { ConnectRepoModal } from "~/components/ConnectRepoModal";
import { RouterLink } from "~/components/RouterLink";
import { SDK_LANG_LABEL } from "~/components/SdkLangIcon";
import type { SdkTargetContext } from "~/components/sdkTargetShared";
import {
  deriveTargetVersions,
  getApi,
  getSdk,
  getSdkTarget,
  getSdkTargetSdkJson,
  listGitProviders,
  listPackageRegistries,
  listRegistryConnections,
  listRepoConnections,
  listTargetVersions,
  loadReleasesByConn,
} from "~/data";
import { sdkBuildStatus } from "~/lib/sdkStatus";
import { formatVersion } from "~/version";
import type { Route } from "./+types/sdks.$sdkId.targets.$targetId";

export function meta() {
  return [{ title: "SDK target — apitoolchain" }];
}

// Every form/modal posts to the target path (`base`); expose the shared action
// here (each tab route re-exports it too).
export { sdkTargetAction as action } from "~/lib/sdkTargetAction";

export async function loader({ params }: Route.LoaderArgs) {
  const target = await getSdkTarget(params.targetId);
  if (!target) throw new Response("Not Found", { status: 404 });
  const [
    sdk,
    api,
    providers,
    connections,
    rawVersions,
    registries,
    registryConnections,
    sdkJson,
  ] = await Promise.all([
    getSdk(params.sdkId),
    getApi(target.apiId),
    listGitProviders(),
    listRepoConnections("sdk", target.id),
    listTargetVersions(target.id),
    listPackageRegistries(),
    listRegistryConnections(target.id),
    getSdkTargetSdkJson(target.id),
  ]);
  const releasesByConn = await loadReleasesByConn(connections);
  const versions = deriveTargetVersions(
    target,
    api?.versions ?? [],
    rawVersions,
    api?.distTags ?? [],
  );
  return {
    target,
    sdkId: params.sdkId,
    sdkName: sdk?.name ?? "SDK",
    // The parent SDK's OWN version (the global "builds" version) — decoupled
    // from this target's per-language package version + the API spec version.
    sdkVersion: sdk?.version ?? "",
    apiName: api?.name ?? target.apiId,
    providers,
    connections,
    releasesByConn,
    versions,
    registries,
    registryConnections,
    sdkJson,
  };
}

/**
 * The SDK-target layout: PageHeader (breadcrumb, title, status, tabs, Connect
 * action) + a right-side Actions/Meta panel + the Connect-repo /
 * Connect-registry modals. Each tab is its own route file rendered through
 * `<Outlet>`, reading shared data via `SdkTargetContext`.
 */
export default function SdkTargetLayout({ loaderData }: Route.ComponentProps) {
  const {
    target,
    sdkId,
    sdkName,
    sdkVersion,
    apiName,
    providers,
    connections,
    releasesByConn,
    versions,
    registries,
    registryConnections,
    sdkJson,
  } = loaderData;
  const label = SDK_LANG_LABEL[target.language];
  const ready = target.status === "ready";
  // Human display name from the API title + language (e.g. "LiveSession API
  // Node") — decoupled from the internal slug and the published package name.
  // Prefer the target's stored display title; fall back to a derived name (from
  // the SDK's name) for legacy targets that predate it.
  const title = target.name || `${sdkName} ${label}`.trim() || `${label} SDK`;
  const base = `/sdks/${sdkId}/targets/${target.id}`;
  const [connectOpen, setConnectOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  // Utility actions live behind the Actions section's hover "more" menu — once a
  // repo is connected, connecting more is here rather than a visible button.
  const moreActionItems: DropdownMenuItem[] = [];
  if (connections.length > 0) {
    moreActionItems.push({
      key: "connect",
      label: "Connect another repo",
      icon: "git",
      onSelect: () => setConnectOpen(true),
    });
  }
  if (registryConnections.length > 0) {
    moreActionItems.push({
      key: "connect-publisher",
      label: "Connect another publisher",
      icon: "sdk",
      onSelect: () => setPublishOpen(true),
    });
  }

  const { pathname } = useLocation();
  const activeTab =
    pathname.slice(base.length).replace(/^\/+/, "").split("/")[0] || "overview";

  const ctx: SdkTargetContext = {
    target,
    sdkId,
    sdkVersion,
    apiName,
    base,
    label,
    ready,
    versions,
    connections,
    releasesByConn,
    registries,
    registryConnections,
    providers,
    sdkJson,
    openConnect: () => setConnectOpen(true),
    openPublish: () => setPublishOpen(true),
  };

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
        leadingActions={<StatusPill status={sdkBuildStatus(target)} />}
        tabs={
          <Tabs
            linkComponent={RouterLink}
            activeKey={activeTab}
            items={[
              { key: "overview", label: "Overview", href: base },
              {
                key: "versions",
                label: "Versions",
                count: versions.length,
                href: `${base}/versions`,
              },
              {
                key: "repository",
                label: "Repository",
                count: connections.length,
                href: `${base}/repository`,
              },
              {
                key: "publishing",
                label: "Publishing",
                count: registryConnections.length,
                href: `${base}/publishing`,
              },
              { key: "settings", label: "Settings", href: `${base}/settings` },
            ]}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            {/* Only the FIRST publisher connect lives in the header; once a
                publisher is connected, connect more from the Publishing tab. */}
            {registryConnections.length === 0 && (
              <ButtonCTA
                variant="secondary"
                size="sm"
                icon="sdk"
                onClick={() => setPublishOpen(true)}
                disabled={!ready}
              >
                Connect publisher
              </ButtonCTA>
            )}
            {/* Only the FIRST repo connect lives in the header; once connected,
                connect more from the Actions panel. */}
            {connections.length === 0 && (
              <ButtonCTA
                variant="primary"
                size="sm"
                icon="git"
                onClick={() => setConnectOpen(true)}
                disabled={!ready}
              >
                Connect repo
              </ButtonCTA>
            )}
          </div>
        }
      />

      {/* Fill the viewport: -mt-6 meets the PageHeader's bottom border, -mb-16
          cancels the content padding so the panel border reaches the bottom. */}
      <div className="-mt-6 -mb-16 flex flex-1">
        <div className="min-w-0 flex-1 pt-6 pr-8 pb-16">
          <Outlet context={ctx} />
        </div>

        <RightPanel placement="content-right">
          {ready && (
            <RightPanelSection
              title="Actions"
              action={
                moreActionItems.length > 0 ? (
                  <DropdownMenu
                    align="right"
                    items={moreActionItems}
                    trigger={
                      <Button variant="ghost" size="sm" icon="more">
                        <span className="sr-only">More actions</span>
                      </Button>
                    }
                  />
                ) : undefined
              }
            >
              <Button
                variant="secondary"
                icon="download"
                href={`${base}/download`}
              >
                Download
              </Button>
            </RightPanelSection>
          )}

          <RightPanelSection title="Meta">
            <div className="flex flex-col divide-y divide-line-soft rounded-control border border-line bg-surface text-sm">
              <Glance label="Language" value={label} />
              <Glance
                label="API version"
                value={formatVersion(target.apiVersion)}
              />
              <Glance label="Version" value={formatVersion(target.version)} />
              <Glance
                label="Package name"
                value={registryConnections[0]?.packageName || "not published"}
              />
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
        actionPath={base}
        targetKind="sdk"
        distTagOptions={[...new Set(versions.flatMap((v) => v.tags ?? []))]}
      />

      <ConnectRegistryModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        registries={registries}
        actionPath={base}
        language={target.language}
        defaultPackageName={target.packageName || ""}
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
