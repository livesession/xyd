import {
  createRepoConnection,
  prepareRelease,
  publishRelease,
  removeRepoConnection,
  setDistTag,
  setReleaseConfig,
  syncRepoConnection,
  updateApi,
} from "~/data";

/**
 * The shared action for the registry-detail tab tree. Every tab route
 * re-exports it (`export { registryDetailAction as action }`) so any form —
 * from any tab or one of the parent's modals — resolves to the same handler,
 * regardless of which tab is active.
 */
export async function registryDetailAction({
  params,
  request,
}: {
  params: { apiId?: string };
  request: Request;
}) {
  const form = await request.formData();
  const intent = form.get("intent");
  const apiId = params.apiId ?? "";
  if (intent === "rename") {
    return updateApi(apiId, {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
    });
  }
  if (intent === "set-dist-tag") {
    return setDistTag(
      apiId,
      String(form.get("tag") ?? ""),
      String(form.get("version") ?? ""),
    );
  }
  if (intent === "connect-repo") {
    return createRepoConnection({
      providerId: String(form.get("providerId") ?? ""),
      targetKind: "spec",
      targetId: apiId,
      repo: String(form.get("repo") ?? ""),
      createRepo: form.get("createRepo") === "1",
      makePrivate: form.get("makePrivate") === "1",
      branch: String(form.get("branch") ?? "") || undefined,
      prefix: String(form.get("prefix") ?? ""),
      releaseMode: String(form.get("releaseMode") ?? "") || undefined,
      autoRelease: form.get("autoRelease") === "1",
      distTags: String(form.get("distTags") ?? "") || undefined,
    });
  }
  if (intent === "release-config") {
    return setReleaseConfig(String(form.get("id") ?? ""), {
      releaseMode: String(form.get("releaseMode") ?? "push"),
      autoRelease: form.get("autoRelease") === "1",
      baseBranch: String(form.get("baseBranch") ?? "") || undefined,
      prerelease: form.get("prerelease") === "1",
      distTags: String(form.get("distTags") ?? "") || undefined,
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
  return { ok: false as const, message: "Unknown action" };
}
