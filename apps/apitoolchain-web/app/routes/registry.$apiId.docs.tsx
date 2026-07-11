import {
  Badge,
  ButtonCTA,
  type Column,
  EmptyState,
  StatusPill,
  Table,
} from "@apitoolchain/design-system";
import { useOutletContext } from "react-router";
import type { RegistryDetailContext } from "~/components/registryDetailShared";
import type { DocsProject } from "~/data";

export { registryDetailAction as action } from "~/lib/registryDetailAction";

export default function RegistryDocsTab() {
  const { docs } = useOutletContext<RegistryDetailContext>();

  const docsCols: Column<DocsProject>[] = [
    {
      key: "name",
      header: "Name",
      width: "auto",
      render: (d) => <span className="font-medium text-ink">{d.name}</span>,
    },
    {
      key: "theme",
      header: "Theme",
      width: "sm",
      render: (d) => <Badge tone="neutral">{d.theme}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      align: "right",
      render: (d) => <StatusPill status={d.status} />,
    },
  ];

  if (docs.length === 0) {
    return (
      <EmptyState
        icon="docs"
        title="No docs sites match"
        description="Create a docs site to publish reference + guides, or clear the filters above."
        action={
          <ButtonCTA variant="primary" icon="plus">
            New docs site
          </ButtonCTA>
        }
      />
    );
  }
  return <Table columns={docsCols} rows={docs} getRowKey={(d) => d.id} />;
}
