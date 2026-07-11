import {
  Badge,
  Button,
  EmptyState,
  Field,
  Icon,
  Input,
  Mono,
  Select,
} from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { DeleteConfirm } from "~/components/DeleteConfirm";
import { SettingsHeader } from "~/components/SettingsHeader";
import {
  connectPackageRegistry,
  listPackageRegistries,
  type PackageRegistry,
  type PackageRegistryKind,
  removePackageRegistry,
} from "~/data";
import {
  REGISTRY_KIND_ICON,
  REGISTRY_KIND_LABEL,
  REGISTRY_KINDS,
} from "~/lib/registryKind";
import type { Route } from "./+types/settings.publishing";

export function meta() {
  return [{ title: "Publishing — apitoolchain" }];
}

const KIND_OPTIONS = REGISTRY_KINDS.map((k) => ({
  value: k,
  label: REGISTRY_KIND_LABEL[k],
}));

export async function loader() {
  return { registries: await listPackageRegistries() };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  if (form.get("intent") === "remove") {
    return removePackageRegistry(String(form.get("id") ?? ""));
  }
  const url = String(form.get("url") ?? "").trim();
  if (!url)
    return { ok: false as const, message: "A registry URL is required." };
  return connectPackageRegistry({
    kind: String(form.get("kind") ?? "npm") as PackageRegistryKind,
    url,
    token: String(form.get("token") ?? "").trim() || undefined,
    name: String(form.get("name") ?? "").trim() || undefined,
  });
}

export default function SettingsPublishingRoute({
  loaderData,
}: Route.ComponentProps) {
  const { registries } = loaderData;
  return (
    <>
      <SettingsHeader active="publishing" />
      <div className="flex max-w-[640px] flex-col gap-6">
        <p className="text-sm text-subtle">
          Connect a package registry (npm, PyPI, Maven, …) to publish generated
          SDKs into it. Tokens are stored server-side and never sent to the
          browser. Connect an SDK target to a registry from its{" "}
          <span className="font-medium text-ink">Publishing</span> tab.
        </p>
        <ConnectRegistryForm />
        <RegistriesList registries={registries} />
      </div>
    </>
  );
}

function ConnectRegistryForm() {
  const fetcher = useFetcher<typeof action>();
  const [kind, setKind] = useState<PackageRegistryKind>("npm");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const submitting = fetcher.state !== "idle";
  const submitted = useRef(false);
  const error = fetcher.data && !fetcher.data.ok ? fetcher.data.message : null;

  useEffect(() => {
    if (submitted.current && fetcher.state === "idle" && fetcher.data?.ok) {
      submitted.current = false;
      setUrl("");
      setToken("");
    }
  }, [fetcher.state, fetcher.data]);

  function connect() {
    if (!url.trim() || submitting) return;
    submitted.current = true;
    fetcher.submit({ intent: "connect", kind, url, token }, { method: "post" });
  }

  return (
    <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5">
      <div className="text-sm font-semibold text-ink">Connect a registry</div>
      <Field label="Registry" htmlFor="pr-kind">
        <Select
          id="pr-kind"
          value={kind}
          onChange={(v) => setKind(v as PackageRegistryKind)}
          options={KIND_OPTIONS}
          leadingIcon={REGISTRY_KIND_ICON[kind]}
        />
      </Field>
      <Field
        label="Registry URL"
        htmlFor="pr-url"
        hint="e.g. http://localhost:4873 (verdaccio), or a local file-feed path."
      >
        <Input
          id="pr-url"
          value={url}
          onChange={setUrl}
          placeholder="http://localhost:4873"
        />
      </Field>
      <Field
        label="Token"
        htmlFor="pr-token"
        hint="Optional for file feeds. For an npm registry enter any value (a local verdaccio ignores it) — the npm client won't publish without one."
      >
        <Input
          id="pr-token"
          value={token}
          onChange={setToken}
          placeholder="(none)"
        />
      </Field>
      {error && (
        <div className="rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}
      <div>
        <Button
          variant="primary"
          icon="sdk"
          onClick={connect}
          disabled={!url.trim() || submitting}
        >
          {submitting ? "Connecting…" : "Connect registry"}
        </Button>
      </div>
    </div>
  );
}

function RegistriesList({ registries }: { registries: PackageRegistry[] }) {
  if (registries.length === 0) {
    return (
      <EmptyState
        icon="sdk"
        title="No registries connected"
        description="Connect a package registry above to start publishing SDKs."
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {registries.map((r) => (
        <RegistryRow key={r.id} registry={r} />
      ))}
    </div>
  );
}

function RegistryRow({ registry }: { registry: PackageRegistry }) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon icon={REGISTRY_KIND_ICON[registry.kind]} size={18} />
        <span className="truncate font-medium text-ink">{registry.name}</span>
        <Badge tone="neutral">{REGISTRY_KIND_LABEL[registry.kind]}</Badge>
        <Mono tone="muted">{registry.url}</Mono>
      </div>
      <DeleteConfirm
        title="Remove registry"
        description={`Disconnect ${registry.name}? SDK targets publishing to it stop until it's reconnected.`}
        confirmLabel="Remove"
        confirming={busy}
        busyLabel="Removing…"
        onConfirm={() =>
          fetcher.submit(
            { intent: "remove", id: registry.id },
            { method: "post" },
          )
        }
        trigger={(open) => (
          <Button variant="ghost" size="sm" onClick={open} disabled={busy}>
            Remove
          </Button>
        )}
      />
    </div>
  );
}
