import type { Usage } from "../../openapi/v1/src/generated/models/all/platform-api";
import { listUsage } from "./list_usage";

/** `/usage` — time-series (deterministic synthetic for now). */
export const usage: Usage = {
  list: listUsage,
};
