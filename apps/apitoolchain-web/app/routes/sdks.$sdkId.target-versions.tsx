import {
  Button,
  type Column,
  EmptyState,
  LaTable,
  StatusPill,
} from "@apitoolchain/design-system";
import { useMemo } from "react";
import { useOutletContext } from "react-router";
import { RouterLink } from "~/components/RouterLink";
import { TagBadges } from "~/components/registryDetailShared";
import { SDK_LANG_LABEL, SdkLangIcon } from "~/components/SdkLangIcon";
import type {
  SdkDetailContext,
  SdkTargetVersionRow,
} from "~/components/sdkDetailShared";
import { sdkVersionsFilterSchema } from "~/data/filters";
import { useUrlFilters } from "~/hooks/useUrlFilters";
import { formatVersion } from "~/version";

export { sdkDetailAction as action } from "~/lib/sdkDetailAction";

export default function SdkTargetVersionsTab() {
  const { base, rows, openAdd } = useOutletContext<SdkDetailContext>();

  // Data-driven facet values (distinct across the rows) for each column filter.
  const languages = [...new Set(rows.map((r) => r.language))].sort();
  const sdkVersions = [
    ...new Set(rows.map((r) => r.sdkVersion).filter(Boolean)),
  ];
  const apiVersions = [
    ...new Set(rows.map((r) => r.apiVersion).filter(Boolean)),
  ];
  const versions = [...new Set(rows.map((r) => r.version).filter(Boolean))];
  const tags = [...new Set(rows.flatMap((r) => r.tags ?? []))].sort();
  const statuses = [
    ...new Set(rows.map((r) => r.displayStatus).filter(Boolean)),
  ].sort();
  const facetKey = [
    languages,
    sdkVersions,
    apiVersions,
    versions,
    tags,
    statuses,
  ]
    .map((a) => a.join(","))
    .join("|");
  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute on the facet SETs, not array identity
  const schema = useMemo(
    () =>
      sdkVersionsFilterSchema({
        languages,
        sdkVersions,
        apiVersions,
        versions,
        tags,
        statuses,
      }),
    [facetKey],
  );
  const filter = useUrlFilters(schema);

  const targetCols: Column<SdkTargetVersionRow>[] = [
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
      key: "name",
      header: "Name",
      width: "wide",
      render: (r) => <span className="text-body">{r.name}</span>,
    },
    {
      key: "sdkVersion",
      // The parent SDK's OWN version (constant across the table) — the same value
      // shown on the SDK overview + target pages, so it's here for parity.
      header: <span className="whitespace-nowrap">SDK version</span>,
      width: "sm",
      render: (r) => (
        <span className="text-subtle">{formatVersion(r.sdkVersion)}</span>
      ),
    },
    {
      key: "apiVersion",
      header: "API version",
      width: "sm",
      render: (r) => (
        <span className="text-subtle">{formatVersion(r.apiVersion)}</span>
      ),
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
      key: "tags",
      header: "Dist-tag",
      width: "sm",
      render: (r) => <TagBadges tags={r.tags} />,
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
      key: "displayStatus",
      header: "Status",
      width: "sm",
      align: "right",
      render: (r) => <StatusPill status={r.displayStatus} />,
    },
  ];

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="sdk"
        title="No target versions yet"
        description="Add a language target to generate a client library."
        action={
          <Button variant="secondary" icon="plus" onClick={openAdd}>
            Add target
          </Button>
        }
      />
    );
  }
  return (
    <LaTable
      filter={filter}
      data={rows}
      columns={targetCols}
      getRowKey={(r) => r.id}
      rowHref={(r) => `${base}/targets/${r.targetId}`}
      linkComponent={RouterLink}
      searchPlaceholder="Search target versions…"
      empty={
        <EmptyState
          icon="sdk"
          title="No target versions match"
          description="Clear the filters above."
        />
      }
    />
  );
}
