import {
  Badge,
  Button,
  ButtonCTA,
  type Column,
  EmptyState,
  LaTable,
  PageHeader,
} from "@apitoolchain/design-system";
import { useMemo, useState } from "react";
import { GenerateSdkModal } from "~/components/GenerateSdkModal";
import { RouterLink } from "~/components/RouterLink";
import { SdksTabs } from "~/components/SdksTabs";
import {
  addSdkTarget,
  createSdk,
  listApis,
  listSdks,
  listSdkTargets,
  type Sdk,
  type SdkLanguage,
} from "~/data";
import { sdkFilterSchema } from "~/data/filters";
import { useUrlFilters } from "~/hooks/useUrlFilters";
import type { Route } from "./+types/sdks";

export function meta() {
  return [{ title: "SDKs — apitoolchain" }];
}

export async function loader() {
  const [sdks, apis, targets] = await Promise.all([
    listSdks(),
    listApis(),
    listSdkTargets(),
  ]);
  const apiNames = Object.fromEntries(apis.map((a) => [a.id, a.name]));
  return { sdks, apis, apiNames, targetCount: targets.length };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  if (form.get("intent") === "generate-sdk") {
    const apiId = String(form.get("apiId") ?? "");
    const name = String(form.get("name") ?? "").trim() || undefined;
    const id = String(form.get("id") ?? "").trim() || undefined;
    const version = String(form.get("version") ?? "").trim() || undefined;
    const langs = String(form.get("langs") ?? "")
      .split(",")
      .filter(Boolean) as SdkLanguage[];
    // A custom sdk.json (the "wizard" flow) applied to every target; empty in auto.
    const sdkJson = String(form.get("sdkJson") ?? "").trim() || undefined;
    const created = await createSdk({ apiId, name, id });
    if (!created.ok) return { ok: false as const, message: created.message };
    await Promise.all(
      langs.map((l) => addSdkTarget(created.sdk.id, l, version, sdkJson)),
    );
    return { ok: true as const, sdkId: created.sdk.id };
  }
  return { ok: false as const, message: "Unknown action" };
}

export default function SdksRoute({ loaderData }: Route.ComponentProps) {
  const { sdks, apis, apiNames, targetCount } = loaderData;
  const [genOpen, setGenOpen] = useState(false);

  const namespaces = [...new Set(sdks.map((s) => s.namespace))].sort();
  const nsKey = namespaces.join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute on the namespace SET, not array identity
  const schema = useMemo(() => sdkFilterSchema(namespaces), [nsKey]);
  const filter = useUrlFilters(schema);

  // Prominent CTA when there's nothing yet (empty state); a plain button in the
  // header once at least one SDK exists.
  const generateButton = (
    <ButtonCTA variant="primary" icon="sdk" onClick={() => setGenOpen(true)}>
      Generate SDKs
    </ButtonCTA>
  );
  const headerButton =
    sdks.length > 0 ? (
      <Button variant="primary" icon="sdk" onClick={() => setGenOpen(true)}>
        Generate SDKs
      </Button>
    ) : (
      generateButton
    );

  const columns: Column<Sdk>[] = [
    {
      key: "name",
      header: "Name",
      width: "wide",
      render: (s) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{s.name}</div>
          <div className="text-xs text-subtle">
            {s.namespace}/{s.id}
          </div>
        </div>
      ),
    },
    {
      key: "api",
      header: "API",
      width: "md",
      render: (s) => (
        <span className="text-body">{apiNames[s.apiId] ?? s.apiId}</span>
      ),
    },
    {
      key: "targets",
      header: "Targets",
      width: "sm",
      render: (s) => (
        <Badge tone="neutral" icon="sdk">
          {s.targetCount}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      width: "md",
      align: "right",
      render: (s) => <span className="text-subtle">{s.createdAt}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="SDKs"
        actions={headerButton}
        tabs={
          <SdksTabs
            active="sdks"
            sdkCount={sdks.length}
            targetCount={targetCount}
            q={
              filter.rules.length > 0 || filter.query.trim().length > 0
                ? filter.toQuery()
                : undefined
            }
          />
        }
      />
      <LaTable
        filter={filter}
        data={sdks}
        columns={columns}
        getRowKey={(s) => s.id}
        rowHref={(s) => `/sdks/${s.id}`}
        linkComponent={RouterLink}
        searchPlaceholder="Search SDKs…"
        empty={
          <EmptyState
            icon="sdk"
            title="No SDKs match"
            description="Generate an SDK from a registered OpenAPI spec, or clear the filters above."
            action={generateButton}
          />
        }
      />
      <GenerateSdkModal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        apis={apis}
        existingSdkIds={sdks.map((s) => s.id)}
      />
    </>
  );
}
