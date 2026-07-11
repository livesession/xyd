/**
 * A Vite dev-server plugin exposing `POST /opensdk-preview` — it runs the real
 * opensdk emitters (Node) in the Storybook dev process and returns
 * `PreviewResult`. Add it to `.storybook/main.ts` `viteFinal`. NODE-ONLY (it
 * imports the preview backend, which imports `@xyd-js/*`).
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import type { PreviewRequest } from "../model/types";
import { runOpensdkPreview } from "./index";

export const PREVIEW_ENDPOINT = "/opensdk-preview";

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

async function handle(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  res.setHeader("content-type", "application/json");
  try {
    const body = (await readJsonBody(req)) as PreviewRequest;
    const result = await runOpensdkPreview(body);
    res.end(JSON.stringify(result));
  } catch (e) {
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        files: [],
        error: e instanceof Error ? e.message : String(e),
      }),
    );
  }
}

export function opensdkPreviewPlugin(): Plugin {
  return {
    name: "apitoolchain-opensdk-preview",
    configureServer(server) {
      server.middlewares.use(PREVIEW_ENDPOINT, (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }
        void handle(req, res);
      });
    },
  };
}
