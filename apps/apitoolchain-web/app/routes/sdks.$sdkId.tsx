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
import { RouterLink } from "~/components/RouterLink";
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
  const rows: SdkTargetVersionRow[] = targets.flatMap((t) =>
    deriveTargetVersions(t, apiVersions, [], apiDistTags).map((v) => ({
      id: v.id,
      targetId: t.id,
      language: t.language,
      packageName: t.packageName,
      version: v.version,
      status: v.status,
      publishedAt: v.publishedAt ?? "",
      tags: v.tags ?? [],
      search:
        `${t.packageName} ${t.language} ${v.version} ${(v.tags ?? []).join(" ")}`.toLowerCase(),
    })),
  );
  // Per-target "latest version" for the Overview list.
  const currentVersion =
    apiVersions.find((v) => v.current)?.version ??
    apiVersions[0]?.version ??
    "";
  const targetSummaries: SdkOverviewTargetRow[] = targets.map((t) => ({
    id: t.id,
    language: t.language,
    packageName: t.packageName,
    latestVersion:
      apiVersions.length > 1 ? currentVersion || t.version : t.version,
    status: t.status,
    lastPublishedAt: t.lastPublishedAt,
    registryUrl: t.registryUrl,
  }));
  return {
    sdk,
    apiName: api?.name ?? sdk.apiId,
    targets,
    rows,
    targetSummaries,
  };
}

/**
 * The SDK-detail layout: PageHeader (breadcrumb, title, tabs) + a right-side
 * Actions panel + the Add-target modal. Each tab is its own route file rendered
 * through `<Outlet>` and reads shared data via `SdkDetailContext`.
 */
export default function SdkDetailLayout({ loaderData }: Route.ComponentProps) {
  const { sdk, apiName, targets, rows, targetSummaries } = loaderData;
  const base = `/sdks/${sdk.id}`;
  // Namespace breadcrumb → the SDK list filtered by `?q=<SQL>`.
  const nsHref = `/sdks?q=${encodeURIComponent(
    toQuery(sdkFilterSchema([sdk.namespace]), {
      query: "",
      rules: [{ key: "namespace", values: [sdk.namespace] }],
    }),
  )}`;
  const [addOpen, setAddOpen] = useState(false);

  const { pathname } = useLocation();
  const activeTab =
    pathname.slice(base.length).replace(/^\/+/, "").split("/")[0] || "overview";

  const ctx: SdkDetailContext = {
    sdk,
    apiName,
    base,
    rows,
    targetSummaries,
    openAdd: () => setAddOpen(true),
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
        <div className="min-w-0 flex-1 pt-6 pr-8 pb-16">
          <Outlet context={ctx} />
        </div>

        <RightPanel placement="content-right">
          <RightPanelSection title="Actions">
            <Button
              variant="secondary"
              icon="plus"
              onClick={() => setAddOpen(true)}
            >
              Add target
            </Button>
            <Button
              variant="secondary"
              icon="registry"
              href={`/registry/${sdk.apiId}`}
              linkComponent={RouterLink}
            >
              View API
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
    </>
  );
}
