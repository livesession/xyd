import type { Notifications } from "../../openapi/v1/src/generated/models/all/platform-api";
import { listNotifications } from "./list_notifications";
import { markRead } from "./mark_read";

/** `/notifications` — list + mark-read. */
export const notifications: Notifications = {
  list: listNotifications,
  markRead,
};
