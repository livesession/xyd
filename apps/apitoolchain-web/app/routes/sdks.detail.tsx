import {
  Breadcrumb,
  Button,
  Callout,
  type Column,
  DescriptionList,
  EmptyState,
  LaTable,
  Mono,
  PageHeader,
  RightPanel,
  RightPanelSection,
  StatusPill,
  Tabs,
} from "@apitoolchain/design-system";
import { toQuery } from "@apitoolchain/filters";
import { useMemo, useState } from "react";
import { redirect, useFetcher } from "react-router";
import { AddTargetModal } from "~/components/AddTargetModal";
import { RouterLink } from "~/components/RouterLink";
import { SDK_LANG_LABEL, SdkLangIcon } from "~/components/SdkLangIcon";
import {
  addSdkTarget,
  type BuildStatus,
  deleteSdk,
  deriveTargetVersions,
  getApi,
  getSdk,
  listSdkTargetsBySdk,
  type SdkLanguage,
} from "~/data";
import { sdkFilterSchema, sdkVersionsFilterSchema } from "~/data/filters";
import { useUrlFilters } from "~/hooks/useUrlFilters";
import { formatVersion } from "~/version";
import type { Route } from "./+types/sdks.detail";

/** One (target × version) row with a search blob for the free-text filter. */
type TargetVersionRow = {
  id: string;
  targetId: string;
  language: SdkLanguage;
  packageName: string;
  version: string;
  status: BuildStatus;
  publishedAt: string;
  search: string;
};

export function meta() {
  return [{ title: "SDK — apitoolchain" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const sdk = await getSdk(params.sdkId);
  if (!sdk) throw new Response("Not Found", { status: 404 });
  const [api, targets] = await Promise.all([
    getApi(sdk.apiId),
    listSdkTargetsBySdk(sdk.id),
  ]);
  // Expand every target into its full version history so the table lists every
  // version. Each row links back to its general target (which holds all versions).
  const apiVersions = api?.versions ?? [];
  const rows: TargetVersionRow[] = targets.flatMap((t) =>
    deriveTargetVersions(t, apiVersions).map((v) => ({
      id: v.id,
      targetId: t.id,
      language: t.language,
      packageName: t.packageName,
      version: v.version,
      status: v.status,
      publishedAt: v.publishedAt ?? "",
      search: `${t.packageName} ${t.language} ${v.version}`.toLowerCase(),
    })),
  );
  return { sdk, apiName: api?.name ?? sdk.apiId, targets, rows };
}

export async function action({ params, request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    const res = await deleteSdk(params.sdkId);
    if (res.ok) return redirect("/sdks");
    return { ok: false as const, message: res.message ?? "Delete failed." };
  }
  if (intent === "add-target") {
    const langs = String(form.get("langs") ?? "")
      .split(",")
      .filter(Boolean) as SdkLanguage[];
    const results = await Promise.all(
      langs.map((l) => addSdkTarget(params.sdkId, l)),
    );
    const failed = results.find((r) => !r.ok);
    if (failed && !failed.ok)
      return { ok: false as const, message: failed.message };
    return { ok: true as const };
  }
  return { ok: false as const, message: "Unknown action" };
}

type SdkTab = "overview" | "targets" | "settings";

export default function SdkDetailRoute({ loaderData }: Route.ComponentProps) {
  const { sdk, apiName, targets, rows } = loaderData;
  // Namespace breadcrumb → the SDK list filtered by `?q=<SQL>`.
  const nsHref = `/sdks?q=${encodeURIComponent(
    toQuery(sdkFilterSchema([sdk.namespace]), {
      query: "",
      rules: [{ key: "namespace", values: [sdk.namespace] }],
    }),
  )}`;
  const [tab, setTab] = useState<SdkTab>("overview");
  const [addOpen, setAddOpen] = useState(false);
  const del = useFetcher();
  const deleting = del.state !== "idle";
  const delError = (del.data as { message?: string } | undefined)?.message;

  // Filterable table listing every version of every target (Targets tab).
  const languages = [...new Set(rows.map((r) => r.language))].sort();
  const versions = [...new Set(rows.map((r) => r.version))];
  const facetKey = `${languages.join(",")}|${versions.join(",")}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute on the facet SETs, not array identity
  const schema = useMemo(
    () => sdkVersionsFilterSchema(languages, versions),
    [facetKey],
  );
  const filter = useUrlFilters(schema);

  const targetCols: Column<TargetVersionRow>[] = [
    {
      key: "language",
      header: "Language",
      width: "md",
      render: (r) => (
        <span className="flex items-center gap-2">
          <SdkLangIcon language={r.language} />
          <span className="text-body">{SDK_LANG_LABEL[r.language]}</span>
        </span>
      ),
    },
    {
      key: "package",
      header: "Package",
      width: "wide",
      render: (r) => <Mono>{r.packageName || "—"}</Mono>,
    },
    {
      key: "version",
      header: "Version",
      width: "sm",
      render: (r) => (
        <span className="text-body">{formatVersion(r.version)}</span>
      ),
    },
    {
      key: "published",
      header: "Published",
      width: "sm",
      render: (r) => (
        <span className="text-subtle">{r.publishedAt || "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      align: "right",
      render: (r) => <StatusPill status={r.status} />,
    },
  ];

  function onDelete() {
    if (
      !window.confirm(
        `Delete "${sdk.name}" and all its targets? This can't be undone.`,
      ) ||
      deleting
    )
      return;
    del.submit(
      { intent: "delete" },
      { method: "post", action: `/sdks/${sdk.id}` },
    );
  }

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
        description={
          sdk.description || `Client libraries generated from ${apiName}.`
        }
        tabs={
          <Tabs
            activeKey={tab}
            onChange={(k) => setTab(k as SdkTab)}
            items={[
              { key: "overview", label: "Overview" },
              { key: "targets", label: "Targets", count: targets.length },
              { key: "settings", label: "Settings" },
            ]}
          />
        }
      />

      {/* Fill the viewport: -mt-6 meets the PageHeader's bottom border, -mb-16
          cancels the content padding so the panel border reaches the bottom. */}
      <div className="-mt-6 -mb-16 flex flex-1">
        <div className="min-w-0 flex-1 pt-6 pr-8 pb-16">
          {tab === "overview" && (
            <DescriptionList
              items={[
                {
                  label: "API",
                  value: (
                    <RouterLink
                      href={`/registry/${sdk.apiId}`}
                      className="text-blue no-underline hover:underline"
                    >
                      {apiName}
                    </RouterLink>
                  ),
                },
                { label: "Namespace", value: sdk.namespace },
                { label: "Targets", value: String(sdk.targetCount) },
                { label: "Created", value: sdk.createdAt },
              ]}
            />
          )}

          {tab === "targets" &&
            (targets.length === 0 ? (
              <EmptyState
                icon="sdk"
                title="No targets yet"
                description="Add a language target to generate a client library."
                action={
                  <Button
                    variant="secondary"
                    icon="plus"
                    onClick={() => setAddOpen(true)}
                  >
                    Add target
                  </Button>
                }
              />
            ) : (
              <LaTable
                filter={filter}
                data={rows}
                columns={targetCols}
                getRowKey={(r) => r.id}
                rowHref={(r) => `/sdks/${sdk.id}/targets/${r.targetId}`}
                linkComponent={RouterLink}
                searchPlaceholder="Search versions…"
                empty={
                  <EmptyState
                    icon="sdk"
                    title="No versions match"
                    description="Clear the filters above."
                  />
                }
              />
            ))}

          {tab === "settings" && (
            <div className="flex max-w-[640px] flex-col gap-3">
              <div className="text-sm font-semibold text-ink">Danger zone</div>
              <div className="flex items-center gap-3 rounded-control border border-line px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">Delete SDK</div>
                  <div className="text-xs text-subtle">
                    Permanently remove this SDK and every generated target.
                  </div>
                </div>
                <Button variant="danger" onClick={onDelete} disabled={deleting}>
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              </div>
              {delError && <Callout tone="error">{delError}</Callout>}
            </div>
          )}
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
