import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AccessControl } from "@xyd-js/core";
import type { AccessMap } from "../access";
import { generateMiddlewareCore } from "./shared";

/**
 * Generates Vercel Routing Middleware for access control.
 * Creates middleware.js at project root.
 */
export function generateVercelMiddleware(
  config: AccessControl,
  outputDir: string
): void {
  const projectRoot = join(outputDir, "../..");
  const accessMap: AccessMap = (globalThis as any).__xydAccessMap || {};

  const middlewareCore = generateMiddlewareCore(config, accessMap);

  const middleware = `
${middlewareCore}

export default function middleware(request) {
  const result = handleAuthRequest(request);

  if (!result) return; // pass through

  if (result.redirect) {
    return new Response(null, {
      status: 302,
      headers: { Location: result.redirect },
    });
  }

  if (result.status === 404) {
    return new Response("Not Found", { status: 404 });
  }
}
`;

  writeFileSync(join(projectRoot, "middleware.js"), middleware, "utf-8");
}
