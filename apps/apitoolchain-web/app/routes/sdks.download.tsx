import { fetchSdkArtifact } from "~/data";
import type { Route } from "./+types/sdks.download";

/**
 * Resource route: streams the generated SDK zip from the gateway (server-only),
 * forcing a download. No component — the loader returns the file.
 */
export async function loader({ params }: Route.LoaderArgs) {
  const res = await fetchSdkArtifact(params.targetId);
  if (!res) throw new Response("SDK artifact not available", { status: 404 });
  return new Response(res.body, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="sdk-${params.targetId}.zip"`,
    },
  });
}
