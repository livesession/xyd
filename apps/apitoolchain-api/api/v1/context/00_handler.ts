import type { Context } from "../../openapi/v1/src/generated/models/all/platform-api";
import { readContext } from "./get_context";
import { selectProject } from "./select_project";
import { updateContext } from "./update_context";

/** `/context` — read the current context, rename org/project, switch project. */
export const context: Context = {
  read: readContext,
  update: updateContext,
  selectProject,
};
