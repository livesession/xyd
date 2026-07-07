import { redirect } from "react-router";
import {
  createRegistryConnection,
  createRepoConnection,
  deleteSdkTarget,
  prepareRelease,
  publishRegistryConnection,
  publishRelease,
  removeRegistryConnection,
  removeRepoConnection,
  setReleaseConfig,
  syncRepoConnection,
} from "~/data";

/**
 * The shared action for the SDK-target tab tree (layout + every tab re-exports
 * it). All forms/modals post to the target path (`base`), so this one handler
 * covers repo + registry connections, releases and delete regardless of tab.
 */
export async function sdkTargetAction({
  params,
  request,
}: {
  params: { sdkId?: string; targetId?: string };
  request: Request;
}) {
  const form = await request.formData();
  const intent = form.get("intent");
  const targetId = params.targetId ?? "";
  if (intent === "delete") {
    const res = await deleteSdkTarget(targetId);
    if (res.ok) return redirect(`/sdks/${params.sdkId ?? ""}`);
    return { ok: false as const, message: res.message ?? "Delete failed." };
  }
  if (intent === "connect-repo") {
    return createRepoConnection({
      providerId: String(form.get("providerId") ?? ""),
      targetKind: "sdk",
      targetId,
      repo: String(form.get("repo") ?? ""),
      createRepo: form.get("createRepo") === "1",
      makePrivate: form.get("makePrivate") === "1",
      branch: String(form.get("branch") ?? "") || undefined,
      prefix: String(form.get("prefix") ?? ""),
      releaseMode: String(form.get("releaseMode") ?? "") || undefined,
      autoRelease: form.get("autoRelease") === "1",
    });
  }
  if (intent === "release-config") {
    return setReleaseConfig(String(form.get("id") ?? ""), {
      releaseMode: String(form.get("releaseMode") ?? "push"),
      autoRelease: form.get("autoRelease") === "1",
      baseBranch: String(form.get("baseBranch") ?? "") || undefined,
      prerelease: form.get("prerelease") === "1",
    });
  }
  if (intent === "prepare-release") {
    return prepareRelease({ connectionId: String(form.get("id") ?? "") });
  }
  if (intent === "publish-release") {
    return publishRelease(String(form.get("id") ?? ""));
  }
  if (intent === "sync-repo") {
    return syncRepoConnection(String(form.get("id") ?? ""));
  }
  if (intent === "disconnect-repo") {
    return removeRepoConnection(String(form.get("id") ?? ""));
  }
  if (intent === "connect-registry") {
    return createRegistryConnection({
      registryId: String(form.get("registryId") ?? ""),
      targetId,
      packageName: String(form.get("packageName") ?? "") || undefined,
      autoPublish: form.get("autoPublish") === "1",
    });
  }
  if (intent === "publish-registry") {
    return publishRegistryConnection(String(form.get("id") ?? ""));
  }
  if (intent === "disconnect-registry") {
    return removeRegistryConnection(String(form.get("id") ?? ""));
  }
  return { ok: false as const, message: "Unknown action" };
}
