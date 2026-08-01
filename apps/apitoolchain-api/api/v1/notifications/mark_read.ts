import * as notifQ from "../../../dbnode/notifications";
import { pool } from "../../../dbnode/pool";
import type { Notifications } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";

/** POST /notifications/read — mark the given ids (or all) read in the current
 * project; return the count. */
export const markRead: Notifications["markRead"] = async (ctx, input) => {
  const auth = await requireAuth(ctx);
  const updated =
    input.ids && input.ids.length > 0
      ? await notifQ.markNotificationsReadByIds(pool, {
          ids: input.ids,
          projectid: auth.projectId,
        })
      : input.all
        ? await notifQ.markAllNotificationsRead(pool, {
            projectid: auth.projectId,
          })
        : [];
  return { updated: updated.length };
};
