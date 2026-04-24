import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { AccessControl } from "@xyd-js/core";
import type { AccessMap } from "../access";
import { generateMiddlewareCore } from "./shared";

/**
 * Generates Cloudflare Pages Function middleware for access control.
 * Creates functions/_middleware.js alongside the static output.
 */
export function generateCloudflareMiddleware(
  config: AccessControl,
  outputDir: string
): void {
  const functionsDir = join(outputDir, "functions");
  mkdirSync(functionsDir, { recursive: true });

  const accessMap: AccessMap = (globalThis as any).__xydAccessMap || {};

  const middlewareCore = generateMiddlewareCore(config, accessMap);

  const middleware = `
${middlewareCore}

export async function onRequest(context) {
  const result = handleAuthRequest(context.request);

  if (!result) return context.next(); // pass through to static files

  if (result.redirect) {
    return Response.redirect(result.redirect, 302);
  }

  if (result.status === 404) {
    return new Response("Not Found", { status: 404 });
  }
}
`;

  writeFileSync(join(functionsDir, "_middleware.js"), middleware, "utf-8");
}
