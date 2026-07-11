import {
  type Column,
  Mono,
  StatusPill,
  Table,
} from "@apitoolchain/design-system";
import { useOutletContext } from "react-router";
import { TagBadges } from "~/components/registryDetailShared";
import type { SdkTargetContext } from "~/components/sdkTargetShared";
import type { TargetVersion } from "~/data";
import { sdkBuildStatus } from "~/lib/sdkStatus";
import { formatVersion } from "~/version";

export { sdkTargetAction as action } from "~/lib/sdkTargetAction";

export default function SdkTargetVersionsTab() {
  const { versions } = useOutletContext<SdkTargetContext>();

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
      key: "tags",
      header: "Dist-tag",
      width: "md",
      render: (v) => <TagBadges tags={v.tags ?? []} />,
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      render: (v) => <StatusPill status={sdkBuildStatus(v)} />,
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

  return (
    <Table columns={versionCols} rows={versions} getRowKey={(v) => v.id} />
  );
}
