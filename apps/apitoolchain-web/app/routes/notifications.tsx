import {
  type ActivityItem,
  ActivityList,
  Badge,
  EmptyState,
  type IconName,
  PageHeader,
  Tabs,
} from "@apitoolchain/design-system";
import { RouterLink } from "~/components/RouterLink";
import { listNotifications, type NotificationSeverity } from "~/data";
import type { Route } from "./+types/notifications";

export function meta() {
  return [{ title: "Notifications — apitoolchain" }];
}

const FILTERS = ["all", "unread"] as const;
type Filter = (typeof FILTERS)[number];

export async function loader({ params }: Route.LoaderArgs) {
  const param = params.filter as Filter | undefined;
  const filter: Filter = param && FILTERS.includes(param) ? param : "all";
  const all = await listNotifications();
  const items = filter === "unread" ? all.filter((n) => !n.read) : all;
  return {
    filter,
    items,
    unread: all.filter((n) => !n.read).length,
    total: all.length,
  };
}

const SEV_ICON: Record<NotificationSeverity, IconName> = {
  info: "bolt",
  success: "check",
  warning: "alert",
  error: "close",
};
const SEV_TONE: Record<NotificationSeverity, ActivityItem["tone"]> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

export default function NotificationsRoute({
  loaderData,
}: Route.ComponentProps) {
  const { filter, items, unread, total } = loaderData;

  const activity: ActivityItem[] = items.map((n) => ({
    id: n.id,
    icon: SEV_ICON[n.severity],
    tone: SEV_TONE[n.severity],
    when: n.createdAt,
    title: (
      <span className="inline-flex items-center gap-2">
        {n.title}
        {!n.read && (
          <Badge tone="info" dot>
            new
          </Badge>
        )}
      </span>
    ),
    body: n.body,
  }));

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Events across your APIs — publishes, builds, MCP servers, and registry changes."
        tabs={
          <Tabs
            linkComponent={RouterLink}
            activeKey={filter}
            items={[
              {
                key: "all",
                label: "All",
                href: "/notifications",
                count: total,
              },
              {
                key: "unread",
                label: "Unread",
                href: "/notifications/unread",
                count: unread,
              },
            ]}
          />
        }
      />
      <ActivityList
        items={activity}
        empty={
          <EmptyState
            icon="bell"
            title="You're all caught up"
            description="No notifications to show."
          />
        }
      />
    </>
  );
}
