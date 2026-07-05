import {
  Breadcrumb,
  Button,
  Callout,
  DescriptionList,
  Mono,
  PageHeader,
  Section,
  StatusPill,
} from "@apitoolchain/design-system";
import { useState } from "react";
import { redirect, useFetcher } from "react-router";
import { ConnectRepoModal } from "~/components/ConnectRepoModal";
import { RouterLink } from "~/components/RouterLink";
import { SDK_LANG_LABEL, SdkLangIcon } from "~/components/SdkLangIcon";
import {
  createRepoConnection,
  deleteSdkTarget,
  getApi,
  getSdk,
  getSdkTarget,
  listGitProviders,
  listRepoConnections,
  type RepoConnection,
  removeRepoConnection,
  type SdkLanguage,
  syncRepoConnection,
} from "~/data";
import { formatVersion } from "~/version";
import type { Route } from "./+types/sdks.target";

export function meta() {
  return [{ title: "SDK target — apitoolchain" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const target = await getSdkTarget(params.targetId);
  if (!target) throw new Response("Not Found", { status: 404 });
  const [sdk, api, providers, connections] = await Promise.all([
    getSdk(params.sdkId),
    getApi(target.apiId),
    listGitProviders(),
    listRepoConnections("sdk", target.id),
  ]);
  return {
    target,
    sdkId: params.sdkId,
    sdkName: sdk?.name ?? "SDK",
    apiName: api?.name ?? target.apiId,
    providers,
    connections,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    const res = await deleteSdkTarget(params.targetId);
    if (res.ok) return redirect(`/sdks/${params.sdkId}`);
    return { ok: false as const, message: res.message ?? "Delete failed." };
  }
  if (intent === "connect-repo") {
    return createRepoConnection({
      providerId: String(form.get("providerId") ?? ""),
      targetKind: "sdk",
      targetId: params.targetId,
      repo: String(form.get("repo") ?? ""),
      createRepo: form.get("createRepo") === "1",
      makePrivate: form.get("makePrivate") === "1",
      branch: String(form.get("branch") ?? "") || undefined,
      prefix: String(form.get("prefix") ?? ""),
    });
  }
  if (intent === "sync-repo") {
    return syncRepoConnection(String(form.get("id") ?? ""));
  }
  if (intent === "disconnect-repo") {
    return removeRepoConnection(String(form.get("id") ?? ""));
  }
  return { ok: false as const, message: "Unknown action" };
}

function installCmd(language: SdkLanguage, pkg: string): string {
  switch (language) {
    case "node":
      return `npm install ${pkg}`;
    case "python":
      return `pip install ${pkg}`;
    case "go":
      return `go get ${pkg}`;
    case "ruby":
      return `gem install ${pkg}`;
    case "java":
      return `implementation "${pkg}"`;
    case "dotnet":
      return `dotnet add package ${pkg}`;
  }
}

export default function SdkTargetRoute({ loaderData }: Route.ComponentProps) {
  const { target, sdkId, sdkName, apiName, providers, connections } =
    loaderData;
  const label = SDK_LANG_LABEL[target.language];
  const ready = target.status === "ready";
  const title = target.packageName || `${label} SDK`;
  const actionPath = `/sdks/${sdkId}/targets/${target.id}`;
  const [connectOpen, setConnectOpen] = useState(false);

  const del = useFetcher();
  const deleting = del.state !== "idle";
  const delError = (del.data as { message?: string } | undefined)?.message;

  function onDelete() {
    if (
      !window.confirm(`Delete the ${label} target? This can't be undone.`) ||
      deleting
    )
      return;
    del.submit(
      { intent: "delete" },
      { method: "post", action: `/sdks/${sdkId}/targets/${target.id}` },
    );
  }

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            linkComponent={RouterLink}
            items={[
              { label: "SDKs", href: "/sdks" },
              { label: sdkName, href: `/sdks/${sdkId}` },
              { label },
            ]}
          />
        }
        title={title}
        description={`The ${label} target of ${sdkName}.`}
        actions={
          <>
            <StatusPill status={target.status} />
            {ready && (
              <Button
                variant="primary"
                icon="box"
                href={`/sdks/${sdkId}/targets/${target.id}/download`}
              >
                Download
              </Button>
            )}
          </>
        }
      />

      <div className="flex max-w-[760px] flex-col gap-10">
        <Section title="Overview">
          <DescriptionList
            items={[
              {
                label: "Language",
                value: (
                  <span className="inline-flex items-center gap-2 font-medium text-ink">
                    <SdkLangIcon
                      language={target.language}
                      className="size-4 shrink-0"
                    />
                    {label}
                  </span>
                ),
              },
              {
                label: "Package",
                value: <Mono>{target.packageName || "—"}</Mono>,
              },
              {
                label: "Version",
                value: formatVersion(target.version),
              },
              {
                label: "Output",
                value: <Mono tone="muted">{target.output}</Mono>,
              },
              {
                label: "API",
                value: (
                  <RouterLink
                    href={`/registry/${target.apiId}`}
                    className="text-blue no-underline hover:underline"
                  >
                    {apiName}
                  </RouterLink>
                ),
              },
              {
                label: "Published",
                value: target.lastPublishedAt ?? "Not published",
              },
              ...(target.registryUrl
                ? [
                    {
                      label: "Registry",
                      value: <Mono tone="muted">{target.registryUrl}</Mono>,
                    },
                  ]
                : []),
            ]}
          />
        </Section>

        {ready && (
          <Section title="Install">
            <div className="rounded-control border border-line bg-surface-muted px-3 py-2.5">
              <Mono>
                {installCmd(target.language, target.packageName || label)}
              </Mono>
            </div>
          </Section>
        )}

        <Section title="Repository">
          {connections.length === 0 ? (
            <div className="flex items-center gap-3 rounded-control border border-line px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">
                  Sync this SDK to a repo
                </div>
                <div className="text-xs text-subtle">
                  Push the generated {label} SDK into a connected git repo.
                </div>
              </div>
              <Button
                variant="secondary"
                icon="git"
                onClick={() => setConnectOpen(true)}
                disabled={!ready}
              >
                Connect repo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {connections.map((c) => (
                <TargetRepoRow key={c.id} conn={c} actionPath={actionPath} />
              ))}
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon="git"
                  onClick={() => setConnectOpen(true)}
                >
                  Connect another repo
                </Button>
              </div>
            </div>
          )}
        </Section>

        <Section title="Danger zone">
          <div className="flex items-center gap-3 rounded-control border border-line px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink">Delete target</div>
              <div className="text-xs text-subtle">
                Remove this {label} target and its generated artifact.
              </div>
            </div>
            <Button variant="danger" onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
          {delError && <Callout tone="error">{delError}</Callout>}
        </Section>
      </div>

      <ConnectRepoModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        providers={providers}
        actionPath={actionPath}
      />
    </>
  );
}

/** One repo connection on the SDK target page: repo + status + Sync/Remove. */
function TargetRepoRow({
  conn,
  actionPath,
}: {
  conn: RepoConnection;
  actionPath: string;
}) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const status = busy ? "building" : (conn.lastSyncStatus ?? "draft");
  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Mono>{conn.repo}</Mono>
        <StatusPill status={status} />
      </div>
      <div className="flex items-center gap-1.5">
        <fetcher.Form method="post" action={actionPath} className="contents">
          <input type="hidden" name="intent" value="sync-repo" />
          <input type="hidden" name="id" value={conn.id} />
          <Button
            variant="secondary"
            size="sm"
            icon="git"
            type="submit"
            disabled={busy}
          >
            {busy ? "Syncing…" : "Sync"}
          </Button>
        </fetcher.Form>
        <fetcher.Form method="post" action={actionPath} className="contents">
          <input type="hidden" name="intent" value="disconnect-repo" />
          <input type="hidden" name="id" value={conn.id} />
          <Button variant="ghost" size="sm" type="submit" disabled={busy}>
            Remove
          </Button>
        </fetcher.Form>
      </div>
    </div>
  );
}
