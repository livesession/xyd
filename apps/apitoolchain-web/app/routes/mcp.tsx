import {
  Badge,
  type BadgeTone,
  Button,
  type Column,
  EmptyState,
  Menu,
  Mono,
  PageHeader,
  StatusPill,
  Table,
} from "@apitoolchain/design-system";
import { RouterLink } from "~/components/RouterLink";
import {
  listApis,
  listMcpServers,
  type McpServer,
  type McpTransport,
} from "~/data";
import type { Route } from "./+types/mcp";

export function meta() {
  return [{ title: "MCP — apitoolchain" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const apis = await listApis();
  const apiId = new URL(request.url).searchParams.get("apiId") ?? apis[0]?.id;
  const servers = await listMcpServers(apiId);
  const selected = apis.find((a) => a.id === apiId);
  return { apis, apiId, selectedName: selected?.name ?? null, servers };
}

const TRANSPORT: Record<McpTransport, BadgeTone> = {
  http: "info",
  sse: "accent",
  stdio: "neutral",
};

export default function McpRoute({ loaderData }: Route.ComponentProps) {
  const { apis, apiId, selectedName, servers } = loaderData;

  const columns: Column<McpServer>[] = [
    {
      key: "name",
      header: "Server",
      width: "wide",
      render: (m) => <Mono>{m.name}</Mono>,
    },
    {
      key: "sourceSpec",
      header: "Source spec",
      width: "auto",
      render: (m) => <Mono tone="muted">{m.sourceSpec}</Mono>,
    },
    {
      key: "toolsCount",
      header: "Tools",
      width: "xs",
      render: (m) => <Badge tone="neutral">{m.toolsCount}</Badge>,
    },
    {
      key: "transport",
      header: "Transport",
      width: "sm",
      render: (m) => (
        <Badge tone={TRANSPORT[m.transport]}>{m.transport.toUpperCase()}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      render: (m) => <StatusPill status={m.status} />,
    },
    {
      key: "url",
      header: "Endpoint",
      width: "md",
      align: "right",
      render: (m) =>
        m.url ? (
          <a
            href={m.url}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] text-blue no-underline"
          >
            Open
          </a>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="MCP"
        description="Expose a registered API as an MCP server so agents can call it as tools."
        actions={
          <>
            <Menu
              variant="select"
              icon="registry"
              label={selectedName ?? "Select API"}
              linkComponent={RouterLink}
              items={apis.map((a) => ({
                key: a.id,
                label: a.name,
                href: `/mcp?apiId=${a.id}`,
                active: a.id === apiId,
              }))}
            />
            <Button variant="primary" icon="plus">
              New MCP server
            </Button>
          </>
        }
      />
      <Table
        columns={columns}
        rows={servers}
        getRowKey={(m) => m.id}
        empty={
          <EmptyState
            icon="mcp"
            title="No MCP servers"
            description="Generate an MCP server from this API to let agents use it as tools."
            action={
              <Button variant="primary" icon="plus">
                New MCP server
              </Button>
            }
          />
        }
      />
    </>
  );
}
