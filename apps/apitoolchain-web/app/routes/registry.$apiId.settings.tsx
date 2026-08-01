import {
  Button,
  Callout,
  Field,
  Input,
  Mono,
} from "@apitoolchain/design-system";
import { useState } from "react";
import { useFetcher, useOutletContext } from "react-router";
import type { RegistryDetailContext } from "~/components/registryDetailShared";

export { registryDetailAction as action } from "~/lib/registryDetailAction";

/**
 * Registry settings — rename the entry (display name + description). The id,
 * namespace, format, and kind are immutable (they're baked into URLs + the
 * `apis/<ns>/<api>@<ver>` refs), so they're shown read-only.
 */
export default function RegistrySettingsTab() {
  const { api, base } = useOutletContext<RegistryDetailContext>();
  const save = useFetcher();
  const saving = save.state !== "idle";
  const result = save.data as { ok?: boolean; message?: string } | undefined;

  const [name, setName] = useState(api.name);
  const [description, setDescription] = useState(api.description);
  const dirty = name.trim() !== api.name || description !== api.description;

  function onSave() {
    if (!name.trim() || saving) return;
    save.submit(
      { intent: "rename", name: name.trim(), description },
      { method: "post", action: base },
    );
  }

  return (
    <div className="flex max-w-[640px] flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="text-sm font-semibold text-ink">Details</div>
        <Field label="Name">
          <Input value={name} onChange={setName} placeholder="Display name" />
        </Field>
        <Field label="Description">
          <Input
            value={description}
            onChange={setDescription}
            placeholder="Short description (optional)"
          />
        </Field>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={onSave}
            disabled={!dirty || !name.trim() || saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {result?.ok && !dirty && (
            <span className="text-xs text-subtle">Saved.</span>
          )}
        </div>
        {result?.ok === false && (
          <Callout tone="error">{result.message}</Callout>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-ink">Identity</div>
        <p className="m-0 text-sm text-muted">
          The id and namespace can't be changed — they're part of this API's
          URLs and the{" "}
          <Mono tone="muted">apis/&lt;ns&gt;/&lt;id&gt;@&lt;ver&gt;</Mono>{" "}
          registry refs baked into generated SDKs.
        </p>
        <div className="flex flex-col divide-y divide-line-soft rounded-control border border-line bg-surface text-sm">
          <IdentityRow label="Namespace" value={`@${api.namespace}`} />
          <IdentityRow label="ID" value={api.id} />
          <IdentityRow label="Format" value={api.format} />
          <IdentityRow label="Kind" value={api.kind} />
        </div>
      </div>
    </div>
  );
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <span className="text-subtle">{label}</span>
      <Mono tone="muted">{value}</Mono>
    </div>
  );
}
