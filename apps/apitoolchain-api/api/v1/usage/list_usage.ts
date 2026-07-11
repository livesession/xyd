import type { Usage } from "../../openapi/v1/src/generated/models/all/platform-api";
import { usageSeries } from "../__kit/usage";

/** GET /usage?range= — the single required query param arrives positionally. */
export const listUsage: Usage["list"] = async (_ctx, range) => {
  return usageSeries(range);
};
