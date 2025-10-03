import type { Context, Config } from "@netlify/edge-functions";

import {handler} from "@xyd-js/ask-ai-edge"

export default async (request: Request, context: Context) => {
  return handler(request);
};

