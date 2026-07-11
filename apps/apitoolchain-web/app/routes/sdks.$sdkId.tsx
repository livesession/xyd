import {
  Breadcrumb,
  Button,
  PageHeader,
  RightPanel,
  RightPanelSection,
  Tabs,
} from "@apitoolchain/design-system";
import { toQuery } from "@apitoolchain/filters";
import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { AddTargetModal } from "~/components/AddTargetModal";
import { BuildSdkModal } from "~/components/BuildSdkModal";
import { NewVersionModal } from "~/components/NewVersionModal";
import { RouterLink } from "~/components/RouterLink";
import { targetDisplayName } from "~/components/SdkLangIcon";
import type {
  SdkDetailContext,
  SdkOverviewTargetRow,
  SdkTargetVersionRow,
} from "~/components/sdkDetailShared";
import {
  deriveTargetVersions,
  getApi,
  getSdk,
  listSdkTargetsBySdk,
} from "~/data";
import { sdkFilterSchema } from "~/data/filters";
import { sdkBuildStatus } from "~/lib/sdkStatus";
import type { Route } from "./+types/sdks.$sdkId";

export function meta() {
  return [{ title: "SDK — apitoolchain" }];
}

// The delete form + Add-target modal post to `/sdks/:sdkId`; expose the shared
// action here (each tab route re-exports it too).
export { sdkDetailAction as action } from "~/lib/sdkDetailAction";

export async function loader({ params }: Route.LoaderArgs) {
  const sdk = await getSdk(params.sdkId);
  if (!sdk) throw new Response("Not Found", { status: 404 });
  const [api, targets] = await Promise.all([
    getApi(sdk.apiId),
    listSdkTargetsBySdk(sdk.id),
  ]);
  // Expand every target into its full version history (each row → its target).
  const apiVersions = api?.versions ?? [];
  const apiDistTags = api?.distTags ?? [];
  const apiName = api?.name ?? sdk.apiId;
  const rows: SdkTargetVersionRow[] = targets.flatMap((t) =>
    deriveTargetVersions(t, apiVersions, [], apiDistTags).map((v) => ({
      id: v.id,
      targetId: t.id,
      name: t.name || targetDisplayName(sdk.name, t.language),
      language: t.language,
      packageName: t.packageName,
      sdkVersion: sdk.version,
      version: v.version,
      apiVersion: t.apiVersion,
      status: v.status,
      displayStatus: sdkBuildStatus({
        status: v.status,
        publishedAt: v.publishedAt ?? "",
      }),
      publishedAt: v.publishedAt ?? "",
      tags: v.tags ?? [],
      search:
        `${t.packageName} ${t.language} ${v.version} ${t.apiVersion} ${(v.tags ?? []).join(" ")}`.toLowerCase(),
    })),
  );
  // Per-target "latest version" for the Overview list.
  const currentVersion =
    apiVersions.find((v) => v.current)?.version ??
    apiVersions[0]?.version ??
    "";
  const targetSummaries: SdkOverviewTargetRow[] = targets.map((t) => ({
    id: t.id,
    name: t.name || targetDisplayName(sdk.name, t.language),
    language: t.language,
    packageName: t.packageName,
    // The target's OWN package version — decoupled from the API version it was
    // built from (shown separately).
    latestVersion: t.version,
    apiVersion: t.apiVersion,
    status: t.status,
    lastPublishedAt: t.lastPublishedAt,
    registryUrl: t.registryUrl,
  }));
  return {
    sdk,
    apiName,
    targets,
    rows,
    targetSummaries,
    apiVersions,
    apiDistTags,
    currentApiVersion: currentVersion,
  };
}

/**
 * The SDK-detail layout: PageHeader (breadcrumb, title, tabs) + a right-side
 * Actions panel + the Add-target modal. Each tab is its own route file rendered
 * through `<Outlet>` and reads shared data via `SdkDetailContext`.
 */
export default function SdkDetailLayout({ loaderData }: Route.ComponentProps) {
  const {
    sdk,
    apiName,
    targets,
    rows,
    targetSummaries,
    apiVersions,
    apiDistTags,
    currentApiVersion,
  } = loaderData;
  const base = `/sdks/${sdk.id}`;
  // Namespace breadcrumb → the SDK list filtered by `?q=<SQL>`.
  const nsHref = `/sdks?q=${encodeURIComponent(
    toQuery(sdkFilterSchema([sdk.namespace]), {
      query: "",
      rules: [{ key: "namespace", values: [sdk.namespace] }],
    }),
  )}`;
  const [addOpen, setAddOpen] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const [newVersionOpen, setNewVersionOpen] = useState(false);

  const { pathname } = useLocation();
  const activeTab =
    pathname.slice(base.length).replace(/^\/+/, "").split("/")[0] || "overview";

  const ctx: SdkDetailContext = {
    sdk,
    apiName,
    base,
    rows,
    targetSummaries,
    apiVersions,
    apiDistTags,
    currentApiVersion,
    openAdd: () => setAddOpen(true),
    openBuild: () => setBuildOpen(true),
  };

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            linkComponent={RouterLink}
            items={[
              { label: "SDKs", href: "/sdks" },
              { label: `@${sdk.namespace}`, href: nsHref },
              { label: sdk.name },
            ]}
          />
        }
        title={sdk.name}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon="sdk"
            onClick={() => setNewVersionOpen(true)}
            disabled={targets.length === 0}
          >
            New version
          </Button>
        }
        tabs={
          <Tabs
            linkComponent={RouterLink}
            activeKey={activeTab}
            items={[
              { key: "overview", label: "Overview", href: base },
              { key: "versions", label: "Versions", href: `${base}/versions` },
              {
                key: "target-versions",
                label: "Target versions",
                href: `${base}/target-versions`,
                count: rows.length,
              },
              { key: "settings", label: "Settings", href: `${base}/settings` },
            ]}
          />
        }
      />

      {/* Fill the viewport: -mt-6 meets the PageHeader's bottom border, -mb-16
          cancels the content padding so the panel border reaches the bottom. */}
      <div className="-mt-6 -mb-16 flex flex-1">
        {/* pr-12 (not pr-8) so a ContentSection's `-mx-12` full-bleed rule lands
            exactly on the right rail's border. */}
        <div className="min-w-0 flex-1 pt-6 pr-12 pb-16">
          <Outlet context={ctx} />
        </div>

        <RightPanel placement="content-right">
          <RightPanelSection title="Actions">
            <Button
              variant="secondary"
              icon="sdk"
              onClick={() => setBuildOpen(true)}
              disabled={targets.length === 0}
            >
              Build
            </Button>
            <Button
              variant="secondary"
              icon="plus"
              onClick={() => setAddOpen(true)}
            >
              Add target
            </Button>
          </RightPanelSection>
        </RightPanel>
      </div>

      <AddTargetModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        sdkId={sdk.id}
        existing={targets.map((t) => t.language)}
      />

      <BuildSdkModal
        open={buildOpen}
        onClose={() => setBuildOpen(false)}
        actionPath={base}
        apiVersions={apiVersions}
        currentApiVersion={currentApiVersion}
      />

      <NewVersionModal
        open={newVersionOpen}
        onClose={() => setNewVersionOpen(false)}
        actionPath={base}
        currentSdkVersion={sdk.version}
        apiVersions={apiVersions}
        currentApiVersion={currentApiVersion}
      />
    </>
  );
}
