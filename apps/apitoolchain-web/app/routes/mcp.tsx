import {
  Badge,
  type BadgeTone,
  ButtonCTA,
  type Column,
  EmptyState,
  LaTable,
  Mono,
  PageHeader,
  StatusPill,
} from "@apitoolchain/design-system";
import { useMemo, useState } from "react";
import { AnnounceModal } from "~/components/AnnounceModal";
import { RouterLink } from "~/components/RouterLink";
import {
  listApis,
  listMcpServers,
  type McpServer,
  type McpTransport,
} from "~/data";
import { mcpFilterSchema } from "~/data/filters";
import { useUrlFilters } from "~/hooks/useUrlFilters";
import type { Route } from "./+types/mcp";

export function meta() {
  return [{ title: "MCP — apitoolchain" }];
}

/** An MCP server flattened with its API name + a search blob. */
type McpRow = McpServer & { apiName: string; search: string };

export async function loader() {
  const [servers, apis] = await Promise.all([listMcpServers(), listApis()]);
  const apiName = Object.fromEntries(apis.map((a) => [a.id, a.name]));
  const rows: McpRow[] = servers.map((m) => ({
    ...m,
    apiName: apiName[m.apiId] ?? m.apiId,
    search: `${m.name} ${m.sourceSpec} ${apiName[m.apiId] ?? ""}`.toLowerCase(),
  }));
  return { rows, apis };
}

const TRANSPORT: Record<McpTransport, BadgeTone> = {
  http: "info",
  sse: "accent",
  stdio: "neutral",
};

export default function McpRoute({ loaderData }: Route.ComponentProps) {
  const { rows, apis } = loaderData;
  const [announce, setAnnounce] = useState(false);

  const apiKey = apis.map((a) => a.id).join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute on the API SET, not array identity
  const schema = useMemo(() => mcpFilterSchema(apis), [apiKey]);
  const filter = useUrlFilters(schema);

  const columns: Column<McpRow>[] = [
    {
      key: "name",
      header: "Server",
      width: "wide",
      render: (m) => <Mono>{m.name}</Mono>,
    },
    {
      key: "api",
      header: "API",
      width: "md",
      render: (m) => <span className="text-body">{m.apiName}</span>,
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
        actions={
          <ButtonCTA
            variant="primary"
            icon="plus"
            onClick={() => setAnnounce(true)}
          >
            New MCP server
          </ButtonCTA>
        }
      />
      <LaTable
        filter={filter}
        data={rows}
        columns={columns}
        getRowKey={(m) => m.id}
        rowHref={(m) => `/registry/${m.apiId}/mcp`}
        linkComponent={RouterLink}
        searchPlaceholder="Search MCP servers…"
        empty={
          <EmptyState
            icon="mcp"
            title="No MCP servers match"
            description="Generate an MCP server from a registered API — or clear the filters above."
            action={
              <ButtonCTA
                variant="primary"
                icon="plus"
                onClick={() => setAnnounce(true)}
              >
                New MCP server
              </ButtonCTA>
            }
          />
        }
      />
      <AnnounceModal
        open={announce}
        onClose={() => setAnnounce(false)}
        feature="MCP servers"
        icon="mcp"
        tone="pink"
        description="Spin up a hosted MCP server from any registered API — its tools, resources, and endpoint wired up automatically. We're putting the finishing touches on it."
      />
    </>
  );
}
