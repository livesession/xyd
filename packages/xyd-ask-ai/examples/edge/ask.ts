// import { env } from "node:process";

import type { Context, Config } from "@netlify/edge-functions";

// import {handler} from "@xyd-js/ask-ai-edge"

export default async (request: Request, context: Context) => {
  return new Response("Hello world");
};

export const config: Config = {
  path: "/ask",
};
