import turndown from "turndown";
import turndownPluginGfm from "turndown-plugin-gfm";

import { turndownPluginXyd } from "./turndown-plugin-xyd";

export const turndownService = new turndown({
  codeBlockStyle: "fenced",
});
turndownService.use(turndownPluginXyd);
turndownService.use(turndownPluginGfm.gfm);