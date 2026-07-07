import {
  Badge,
  Button,
  type Column,
  EmptyState,
  LaTable,
  PageHeader,
  StatusPill,
} from "@apitoolchain/design-system";
import { useMemo, useState } from "react";
import { GenerateSdkModal } from "~/components/GenerateSdkModal";
import { RouterLink } from "~/components/RouterLink";
import { SDK_LANG_LABEL, SdkLangIcon } from "~/components/SdkLangIcon";
import { SdksTabs } from "~/components/SdksTabs";
import { listApis, listSdks, listSdkTargets, type SdkTarget } from "~/data";
import { sdkTargetFilterSchema } from "~/data/filters";
import { useUrlFilters } from "~/hooks/useUrlFilters";
import { sdkBuildStatus } from "~/lib/sdkStatus";
import { formatVersion } from "~/version";
import type { Route } from "./+types/sdks.targets";

export function meta() {
  return [{ title: "SDK targets — apitoolchain" }];
}

/** A target flattened with its parent SDK's namespace/name + a search blob. */
type FlatTarget = SdkTarget & {
  namespace: string;
  sdkName: string;
  search: string;
};

export async function loader() {
  const [targets, sdks, apis] = await Promise.all([
    listSdkTargets(),
    listSdks(),
    listApis(),
  ]);
  const sdkById = new Map(sdks.map((s) => [s.id, s]));
  const rows: FlatTarget[] = targets.map((t) => {
    const sdk = sdkById.get(t.sdkId);
    const namespace = sdk?.namespace ?? "";
    const sdkName = sdk?.name ?? t.sdkId;
    return {
      ...t,
      namespace,
      sdkName,
      search:
        `${sdkName} ${t.packageName} ${t.language} ${namespace}`.toLowerCase(),
    };
  });
  return { rows, apis, sdkCount: sdks.length };
}

export default function SdkTargetsRoute({ loaderData }: Route.ComponentProps) {
  const { rows, apis, sdkCount } = loaderData;
  const [genOpen, setGenOpen] = useState(false);

  const namespaces = [...new Set(rows.map((r) => r.namespace))]
    .filter(Boolean)
    .sort();
  const languages = [...new Set(rows.map((r) => r.language))].sort();
  const facetKey = `${namespaces.join(",")}|${languages.join(",")}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute on the facet SET, not array identity
  const schema = useMemo(
    () => sdkTargetFilterSchema(namespaces, languages),
    [facetKey],
  );
  const filter = useUrlFilters(schema);
  const q =
    filter.rules.length > 0 || filter.query.trim().length > 0
      ? filter.toQuery()
      : undefined;

  const columns: Column<FlatTarget>[] = [
    {
      key: "language",
      header: "Language",
      width: "md",
      render: (t) => (
        <span className="flex items-center gap-2">
          <SdkLangIcon language={t.language} />
          <span className="text-body">{SDK_LANG_LABEL[t.language]}</span>
        </span>
      ),
    },
    {
      key: "sdk",
      header: "SDK",
      width: "wide",
      render: (t) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{t.sdkName}</div>
          <div className="text-xs text-subtle">
            {t.namespace}/{t.packageName}
          </div>
        </div>
      ),
    },
    {
      key: "version",
      header: "Latest version",
      width: "sm",
      render: (t) => (
        <span className="text-body">{formatVersion(t.version)}</span>
      ),
    },
    {
      key: "namespace",
      header: "Namespace",
      width: "sm",
      render: (t) => (
        <Badge tone="neutral" icon="registry">
          {t.namespace}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      align: "right",
      render: (t) => <StatusPill status={sdkBuildStatus(t)} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="SDKs"
        actions={
          <Button variant="primary" icon="sdk" onClick={() => setGenOpen(true)}>
            Generate SDKs
          </Button>
        }
        tabs={
          <SdksTabs
            active="targets"
            sdkCount={sdkCount}
            targetCount={rows.length}
            q={q}
          />
        }
      />
      <LaTable
        filter={filter}
        data={rows}
        columns={columns}
        getRowKey={(t) => t.id}
        rowHref={(t) => `/sdks/${t.sdkId}/targets/${t.id}`}
        linkComponent={RouterLink}
        searchPlaceholder="Search targets…"
        empty={
          <EmptyState
            icon="sdk"
            title="No targets match"
            description="Generate an SDK target, or clear the filters above."
          />
        }
      />
      <GenerateSdkModal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        apis={apis}
      />
    </>
  );
}
