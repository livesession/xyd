import type { Context } from "../../../generated/src/generated/models/all/platform-api";
import { readContext } from "./get_context";
import { updateContext } from "./update_context";

/** `/context` — read + update the org/project context. */
export const context: Context = {
  read: readContext,
  update: updateContext,
};
