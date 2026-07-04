import type { Notifications } from "../../../generated/src/generated/models/all/platform-api";
import * as notifQ from "../../db/generated/notifications_sql";
import { pool } from "../../db/pool";
import { toNotification } from "../../mappers";

/** GET /notifications */
export const listNotifications: Notifications["list"] = async () => {
  return (await notifQ.listNotifications(pool)).map(toNotification);
};
