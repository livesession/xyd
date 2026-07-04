import {
  type ActivityItem,
  ActivityList,
  Badge,
  ChecklistItem,
  type Column,
  Heading,
  type IconName,
  PageHeader,
  Panel,
  StatGrid,
  StatTile,
  Table,
} from "@apitoolchain/design-system";
import { RouterLink } from "~/components/RouterLink";
import {
  getOverviewStats,
  listApis,
  listNotifications,
  type NotificationSeverity,
  type RegistryEntry,
} from "~/data";
import type { Route } from "./+types/home";
import { FORMAT } from "./registry";

export function meta() {
  return [
    { title: "apitoolchain — Home" },
    { name: "description", content: "apitoolchain dashboard" },
  ];
}

export async function loader() {
  const [stats, apis, notifications] = await Promise.all([
    getOverviewStats(),
    listApis(),
    listNotifications(),
  ]);
  return { stats, apis, notifications };
}

const SEV_TONE: Record<NotificationSeverity, ActivityItem["tone"]> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};
const SEV_ICON: Record<NotificationSeverity, IconName> = {
  info: "bolt",
  success: "check",
  warning: "alert",
  error: "close",
};

const STAT_LINK = "block text-inherit no-underline";

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  const { stats, apis, notifications } = loaderData;

  const activity: ActivityItem[] = notifications.slice(0, 4).map((n) => ({
    id: n.id,
    icon: SEV_ICON[n.severity],
    tone: SEV_TONE[n.severity],
    when: n.createdAt,
    title: n.title,
    body: n.body,
  }));

  const recentColumns: Column<RegistryEntry>[] = [
    {
      key: "name",
      header: "API",
      width: "wide",
      render: (a) => <span className="font-medium text-ink">{a.name}</span>,
    },
    {
      key: "format",
      header: "Format",
      width: "sm",
      render: (a) => (
        <Badge tone={FORMAT[a.format].tone}>{FORMAT[a.format].label}</Badge>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      width: "md",
      align: "right",
      render: (a) => <span className="text-subtle">{a.updatedAt}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Home"
        description="Register an API, then ship SDKs, docs, and an MCP server from one spec."
      />

      <div className="mb-9">
        <StatGrid columns={4}>
          <RouterLink href="/registry" className={STAT_LINK}>
            <StatTile label="APIs" value={String(stats.apis)} lineTone="blue" />
          </RouterLink>
          <RouterLink href="/sdks" className={STAT_LINK}>
            <StatTile
              label="SDK targets"
              value={String(stats.sdkTargets)}
              lineTone="green"
            />
          </RouterLink>
          <RouterLink href="/docs" className={STAT_LINK}>
            <StatTile
              label="Docs sites"
              value={String(stats.docsProjects)}
              lineTone="pink"
              lineStyle="dashed"
            />
          </RouterLink>
          <RouterLink href="/mcp" className={STAT_LINK}>
            <StatTile
              label="MCP servers"
              value={String(stats.mcpServers)}
              lineTone="orange"
            />
          </RouterLink>
        </StatGrid>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-11">
        <section>
          <Heading>Get started</Heading>
          <div className="mb-9">
            <Panel>
              <div className="flex flex-col gap-5">
                <ChecklistItem
                  icon="registry"
                  label="Register an API"
                  step={1}
                />
                <ChecklistItem icon="sdk" label="Generate an SDK" step={2} />
                <ChecklistItem icon="docs" label="Publish docs" step={3} />
                <ChecklistItem
                  icon="mcp"
                  label="Start an MCP server"
                  step={4}
                />
              </div>
            </Panel>
          </div>

          <Heading>Recently updated APIs</Heading>
          <Table
            columns={recentColumns}
            rows={apis.slice(0, 4)}
            getRowKey={(a) => a.id}
            rowHref={(a) => `/registry/${a.id}`}
            linkComponent={RouterLink}
          />
        </section>

        <section>
          <Heading>Activity</Heading>
          <ActivityList items={activity} />
        </section>
      </div>
    </>
  );
}
