import type { Notifications } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as notifQ from "../../db/generated/notifications_sql";
import { pool } from "../../db/pool";
import { toNotification } from "../../mappers";

/** GET /notifications — scoped to the current project. */
export const listNotifications: Notifications["list"] = async (ctx) => {
  const auth = await requireAuth(ctx);
  return (
    await notifQ.listNotifications(pool, { projectId: auth.projectId })
  ).map(toNotification);
};
