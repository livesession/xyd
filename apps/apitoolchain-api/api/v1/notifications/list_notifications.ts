import * as notifQ from "../../../dbnode/notifications";
import { pool } from "../../../dbnode/pool";
import type { Notifications } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { toNotification } from "../__kit/mappers";

/** GET /notifications — scoped to the current project. */
export const listNotifications: Notifications["list"] = async (ctx) => {
  const auth = await requireAuth(ctx);
  return (
    await notifQ.listNotifications(pool, { projectId: auth.projectId })
  ).map(toNotification);
};
