import {
  Button,
  type Column,
  EmptyState,
  LaTable,
  Mono,
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
import { sdkBuildStatus } from "~/lib/sdkStatus";
import { formatVersion } from "~/version";

export { sdkDetailAction as action } from "~/lib/sdkDetailAction";

export default function SdkVersionsTab() {
  const { base, rows, openAdd } = useOutletContext<SdkDetailContext>();

  const languages = [...new Set(rows.map((r) => r.language))].sort();
  const versions = [...new Set(rows.map((r) => r.version))];
  const facetKey = `${languages.join(",")}|${versions.join(",")}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute on the facet SETs, not array identity
  const schema = useMemo(
    () => sdkVersionsFilterSchema(languages, versions),
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
      key: "status",
      header: "Status",
      width: "sm",
      align: "right",
      render: (r) => <StatusPill status={sdkBuildStatus(r)} />,
    },
  ];

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="sdk"
        title="No versions yet"
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
      searchPlaceholder="Search versions…"
      empty={
        <EmptyState
          icon="sdk"
          title="No versions match"
          description="Clear the filters above."
        />
      }
    />
  );
}
