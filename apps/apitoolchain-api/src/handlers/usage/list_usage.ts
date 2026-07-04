import type { Usage } from "../../../generated/src/generated/models/all/platform-api";
import { usageSeries } from "../../usage";

/** GET /usage?range= — the single required query param arrives positionally. */
export const listUsage: Usage["list"] = async (_ctx, range) => {
  return usageSeries(range);
};
