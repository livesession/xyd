import { Badge, type Column, Mono, Table } from "@apitoolchain/design-system";
import { useOutletContext } from "react-router";
import {
  type RegistryDetailContext,
  TagBadges,
} from "~/components/registryDetailShared";
import type { ApiVersion } from "~/data";
import { formatVersion } from "~/version";

export { registryDetailAction as action } from "~/lib/registryDetailAction";

export default function RegistryVersionsTab() {
  const { api, tagsByVersion } = useOutletContext<RegistryDetailContext>();

  const versionCols: Column<ApiVersion>[] = [
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
      render: (v) => <TagBadges tags={tagsByVersion.get(v.version) ?? []} />,
    },
    {
      key: "specUrl",
      header: "Spec",
      width: "auto",
      render: (v) => <Mono tone="muted">{v.specUrl}</Mono>,
    },
    {
      key: "current",
      header: "State",
      width: "sm",
      render: (v) =>
        v.current ? (
          <Badge tone="success" dot>
            current
          </Badge>
        ) : (
          <Badge tone="neutral">archived</Badge>
        ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      width: "md",
      align: "right",
      render: (v) => <span className="text-subtle">{v.updatedAt}</span>,
    },
  ];

  return (
    <Table
      columns={versionCols}
      rows={api.versions}
      getRowKey={(v) => v.version}
    />
  );
}
