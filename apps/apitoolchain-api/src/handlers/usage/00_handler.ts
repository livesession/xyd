import type { Usage } from "../../../generated/src/generated/models/all/platform-api";
import { listUsage } from "./list_usage";

/** `/usage` — time-series (deterministic synthetic for now). */
export const usage: Usage = {
  list: listUsage,
};
