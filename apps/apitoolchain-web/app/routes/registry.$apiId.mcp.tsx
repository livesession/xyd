import {
  Badge,
  ButtonCTA,
  type Column,
  EmptyState,
  Mono,
  StatusPill,
  Table,
} from "@apitoolchain/design-system";
import { useOutletContext } from "react-router";
import type { RegistryDetailContext } from "~/components/registryDetailShared";
import type { McpServer } from "~/data";

export { registryDetailAction as action } from "~/lib/registryDetailAction";

export default function RegistryMcpTab() {
  const { mcp } = useOutletContext<RegistryDetailContext>();

  const mcpCols: Column<McpServer>[] = [
    {
      key: "name",
      header: "Server",
      width: "auto",
      render: (m) => <Mono>{m.name}</Mono>,
    },
    {
      key: "toolsCount",
      header: "Tools",
      width: "xs",
      render: (m) => <Badge tone="neutral">{m.toolsCount}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      align: "right",
      render: (m) => <StatusPill status={m.status} />,
    },
  ];

  if (mcp.length === 0) {
    return (
      <EmptyState
        icon="mcp"
        title="No MCP servers match"
        description="Generate an MCP server from a registered API — or clear the filters above."
        action={
          <ButtonCTA variant="primary" icon="plus">
            New MCP server
          </ButtonCTA>
        }
      />
    );
  }
  return <Table columns={mcpCols} rows={mcp} getRowKey={(m) => m.id} />;
}
