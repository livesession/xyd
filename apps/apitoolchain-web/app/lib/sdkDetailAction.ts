import { redirect } from "react-router";
import { addSdkTarget, deleteSdk, type SdkLanguage } from "~/data";

/**
 * The shared action for the SDK-detail tab tree (layout + every tab re-exports
 * it) so the delete form and the Add-target modal — which post to `/sdks/:sdkId`
 * — resolve to the same handler.
 */
export async function sdkDetailAction({
  params,
  request,
}: {
  params: { sdkId?: string };
  request: Request;
}) {
  const form = await request.formData();
  const intent = form.get("intent");
  const sdkId = params.sdkId ?? "";
  if (intent === "delete") {
    const res = await deleteSdk(sdkId);
    if (res.ok) return redirect("/sdks");
    return { ok: false as const, message: res.message ?? "Delete failed." };
  }
  if (intent === "add-target") {
    const langs = String(form.get("langs") ?? "")
      .split(",")
      .filter(Boolean) as SdkLanguage[];
    const results = await Promise.all(langs.map((l) => addSdkTarget(sdkId, l)));
    const failed = results.find((r) => !r.ok);
    if (failed && !failed.ok) {
      return { ok: false as const, message: failed.message };
    }
    return { ok: true as const };
  }
  return { ok: false as const, message: "Unknown action" };
}
