import type { Overview } from "../../openapi/v1/src/generated/models/all/platform-api";
import { getStats } from "./get_stats";

/** `/overview` — dashboard stats. */
export const overview: Overview = {
  stats: getStats,
};
