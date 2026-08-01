/**
 * Browser-safe `GeneratePreview` that POSTs to the preview endpoint (the
 * Storybook dev middleware, or a web resource route). Imports only types — no
 * `@xyd-js/*`, safe for the client bundle.
 */
import type {
  GeneratePreview,
  PreviewRequest,
  PreviewResult,
} from "./model/types";

export const PREVIEW_ENDPOINT = "/opensdk-preview";

export function createFetchPreview(
  endpoint: string = PREVIEW_ENDPOINT,
): GeneratePreview {
  return async (req: PreviewRequest): Promise<PreviewResult> => {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok)
        return {
          files: [],
          error: `Preview server error (HTTP ${res.status})`,
        };
      return (await res.json()) as PreviewResult;
    } catch (e) {
      return {
        files: [],
        error: `Preview unavailable — is the dev server running? (${
          e instanceof Error ? e.message : String(e)
        })`,
      };
    }
  };
}
