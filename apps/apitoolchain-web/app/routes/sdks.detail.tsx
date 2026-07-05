import {
  Breadcrumb,
  Button,
  Callout,
  DescriptionList,
  EmptyState,
  PageHeader,
  Section,
} from "@apitoolchain/design-system";
import { toQuery } from "@apitoolchain/filters";
import { useState } from "react";
import { redirect, useFetcher } from "react-router";
import { AddTargetModal } from "~/components/AddTargetModal";
import { RouterLink } from "~/components/RouterLink";
import { SDK_LANG_LABEL, SdkLangIcon } from "~/components/SdkLangIcon";
import {
  addSdkTarget,
  deleteSdk,
  getApi,
  getSdk,
  listSdkTargetsBySdk,
  type SdkLanguage,
  type SdkTarget,
} from "~/data";
import { sdkFilterSchema } from "~/data/filters";
import type { Route } from "./+types/sdks.detail";

export function meta() {
  return [{ title: "SDK — apitoolchain" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const sdk = await getSdk(params.sdkId);
  if (!sdk) throw new Response("Not Found", { status: 404 });
  const [api, targets] = await Promise.all([
    getApi(sdk.apiId),
    listSdkTargetsBySdk(sdk.id),
  ]);
  return { sdk, apiName: api?.name ?? sdk.apiId, targets };
}

export async function action({ params, request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    const res = await deleteSdk(params.sdkId);
    if (res.ok) return redirect("/sdks");
    return { ok: false as const, message: res.message ?? "Delete failed." };
  }
  if (intent === "add-target") {
    const langs = String(form.get("langs") ?? "")
      .split(",")
      .filter(Boolean) as SdkLanguage[];
    const results = await Promise.all(
      langs.map((l) => addSdkTarget(params.sdkId, l)),
    );
    const failed = results.find((r) => !r.ok);
    if (failed && !failed.ok)
      return { ok: false as const, message: failed.message };
    return { ok: true as const };
  }
  return { ok: false as const, message: "Unknown action" };
}

const STATUS_DOT: Record<string, string> = {
  ready: "bg-success",
  building: "bg-info",
  error: "bg-danger",
  draft: "bg-muted",
  published: "bg-success",
};

function TargetCard({ sdkId, t }: { sdkId: string; t: SdkTarget }) {
  return (
    <RouterLink
      href={`/sdks/${sdkId}/targets/${t.id}`}
      className="flex items-center justify-between gap-2 rounded-control border border-line px-3 py-2 no-underline transition-colors hover:bg-hover"
    >
      <span className="flex min-w-0 items-center gap-2">
        <SdkLangIcon language={t.language} />
        <span className="truncate text-sm font-medium text-ink">
          {SDK_LANG_LABEL[t.language]}
        </span>
      </span>
      <span
        className={`size-2 shrink-0 rounded-full ${STATUS_DOT[t.status] ?? "bg-muted"}`}
        title={t.status}
      />
    </RouterLink>
  );
}

export default function SdkDetailRoute({ loaderData }: Route.ComponentProps) {
  const { sdk, apiName, targets } = loaderData;
  // Namespace breadcrumb → the SDK list filtered by `?q=<SQL>`.
  const nsHref = `/sdks?q=${encodeURIComponent(
    toQuery(sdkFilterSchema([sdk.namespace]), {
      query: "",
      rules: [{ key: "namespace", values: [sdk.namespace] }],
    }),
  )}`;
  const [addOpen, setAddOpen] = useState(false);
  const del = useFetcher();
  const deleting = del.state !== "idle";
  const delError = (del.data as { message?: string } | undefined)?.message;

  function onDelete() {
    if (
      !window.confirm(
        `Delete "${sdk.name}" and all its targets? This can't be undone.`,
      ) ||
      deleting
    )
      return;
    del.submit(
      { intent: "delete" },
      { method: "post", action: `/sdks/${sdk.id}` },
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
              { label: `@${sdk.namespace}`, href: nsHref },
              { label: sdk.name },
            ]}
          />
        }
        title={sdk.name}
        description={
          sdk.description || `Client libraries generated from ${apiName}.`
        }
        actions={
          <Button
            variant="secondary"
            icon="registry"
            href={`/registry/${sdk.apiId}`}
            linkComponent={RouterLink}
          >
            View API
          </Button>
        }
      />

      <div className="flex max-w-[760px] flex-col gap-10">
        <Section title="Overview">
          <DescriptionList
            items={[
              { label: "Name", value: sdk.name },
              {
                label: "API",
                value: (
                  <RouterLink
                    href={`/registry/${sdk.apiId}`}
                    className="text-blue no-underline hover:underline"
                  >
                    {apiName}
                  </RouterLink>
                ),
              },
              { label: "Namespace", value: sdk.namespace },
              { label: "Targets", value: String(sdk.targetCount) },
              { label: "Created", value: sdk.createdAt },
            ]}
          />
        </Section>

        <Section
          title="Targets"
          action={
            <Button
              variant="ghost"
              icon="plus"
              onClick={() => setAddOpen(true)}
            >
              Add target
            </Button>
          }
        >
          {targets.length === 0 ? (
            <EmptyState
              icon="sdk"
              title="No targets yet"
              description="Add a language target to generate a client library."
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {targets.map((t) => (
                <TargetCard key={t.id} sdkId={sdk.id} t={t} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Danger zone">
          <div className="flex items-center gap-3 rounded-control border border-line px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink">Delete SDK</div>
              <div className="text-xs text-subtle">
                Permanently remove this SDK and every generated target.
              </div>
            </div>
            <Button variant="danger" onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
          {delError && <Callout tone="error">{delError}</Callout>}
        </Section>
      </div>

      <AddTargetModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        sdkId={sdk.id}
        existing={targets.map((t) => t.language)}
      />
    </>
  );
}
