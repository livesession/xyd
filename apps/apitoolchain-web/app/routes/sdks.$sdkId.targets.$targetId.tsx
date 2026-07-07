import {
  Breadcrumb,
  Button,
  ButtonCTA,
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
  ] = await Promise.all([
    getSdk(params.sdkId),
    getApi(target.apiId),
    listGitProviders(),
    listRepoConnections("sdk", target.id),
    listTargetVersions(target.id),
    listPackageRegistries(),
    listRegistryConnections(target.id),
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
    apiName: api?.name ?? target.apiId,
    providers,
    connections,
    releasesByConn,
    versions,
    registries,
    registryConnections,
  };
}

/**
 * The SDK-target layout: PageHeader (breadcrumb, title, status, tabs, Connect
 * action) + a right-side Actions/At-a-glance panel + the Connect-repo /
 * Connect-registry modals. Each tab is its own route file rendered through
 * `<Outlet>`, reading shared data via `SdkTargetContext`.
 */
export default function SdkTargetLayout({ loaderData }: Route.ComponentProps) {
  const {
    target,
    sdkId,
    sdkName,
    apiName,
    providers,
    connections,
    releasesByConn,
    versions,
    registries,
    registryConnections,
  } = loaderData;
  const label = SDK_LANG_LABEL[target.language];
  const ready = target.status === "ready";
  const title = target.packageName || `${label} SDK`;
  const base = `/sdks/${sdkId}/targets/${target.id}`;
  const [connectOpen, setConnectOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const { pathname } = useLocation();
  const activeTab =
    pathname.slice(base.length).replace(/^\/+/, "").split("/")[0] || "overview";

  const ctx: SdkTargetContext = {
    target,
    sdkId,
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
            <ButtonCTA
              variant="secondary"
              size="sm"
              icon="sdk"
              onClick={() => setPublishOpen(true)}
              disabled={!ready}
            >
              {registryConnections.length
                ? "Connect another publisher"
                : "Connect publisher"}
            </ButtonCTA>
            <ButtonCTA
              variant="primary"
              size="sm"
              icon="git"
              onClick={() => setConnectOpen(true)}
              disabled={!ready}
            >
              {connections.length ? "Connect another repo" : "Connect repo"}
            </ButtonCTA>
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
            <RightPanelSection title="Actions">
              <Button
                variant="secondary"
                icon="download"
                href={`${base}/download`}
              >
                Download
              </Button>
            </RightPanelSection>
          )}

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
        actionPath={base}
        targetKind="sdk"
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
