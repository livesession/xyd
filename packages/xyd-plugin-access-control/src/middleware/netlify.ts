import type { AccessControl } from "@xyd-js/core";
import type { AccessMap } from "../access";
import { generateMiddlewareCore } from "./shared";

/**
 * Generates Netlify Edge Function for access control.
 * Creates netlify/edge-functions/access-control.ts and updates netlify.toml.
 */
export async function generateNetlifyEdge(
  config: AccessControl,
  outputDir: string
): void {
  const { writeFileSync, mkdirSync, readFileSync, existsSync } = await import("node:fs");
  const { join } = await import("node:path");
  const projectRoot = join(outputDir, "../..");
  const edgeFnDir = join(projectRoot, "netlify/edge-functions");
  mkdirSync(edgeFnDir, { recursive: true });

  const accessMap: AccessMap = (globalThis as any).__xydAccessMap || {};

  const middlewareCore = generateMiddlewareCore(config, accessMap);

  const edgeFunction = `
${middlewareCore}

export default async function handler(request) {
  const result = handleAuthRequest(request);

  if (!result) return; // pass through to static files

  if (result.redirect) {
    return Response.redirect(result.redirect, 302);
  }

  if (result.status === 404) {
    return new Response("Not Found", { status: 404 });
  }
}

export const config = { path: "/*" };
`;

  writeFileSync(join(edgeFnDir, "access-control.js"), edgeFunction, "utf-8");

  // Append edge function declaration to netlify.toml if not already present
  const tomlPath = join(projectRoot, "netlify.toml");
  const declaration = `
[[edge_functions]]
  function = "access-control"
  path = "/*"
`;

  if (existsSync(tomlPath)) {
    const existing = readFileSync(tomlPath, "utf-8");
    if (!existing.includes('function = "access-control"')) {
      writeFileSync(tomlPath, existing + "\n" + declaration, "utf-8");
    }
  } else {
    writeFileSync(tomlPath, declaration, "utf-8");
  }
}
