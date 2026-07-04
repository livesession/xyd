import type { Notifications } from "../../../generated/src/generated/models/all/platform-api";
import { listNotifications } from "./list_notifications";
import { markRead } from "./mark_read";

/** `/notifications` — list + mark-read. */
export const notifications: Notifications = {
  list: listNotifications,
  markRead,
};
