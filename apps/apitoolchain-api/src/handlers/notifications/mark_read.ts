import type { Notifications } from "../../../generated/src/generated/models/all/platform-api";
import * as notifQ from "../../db/generated/notifications_sql";
import { pool } from "../../db/pool";

/** POST /notifications/read — mark the given ids (or all) read; return the count. */
export const markRead: Notifications["markRead"] = async (_ctx, input) => {
  const updated =
    input.ids && input.ids.length > 0
      ? await notifQ.markNotificationsReadByIds(pool, { ids: input.ids })
      : input.all
        ? await notifQ.markAllNotificationsRead(pool)
        : [];
  return { updated: updated.length };
};
