import {
  Button,
  Callout,
  type Column,
  EmptyState,
  Field,
  Input,
  Modal,
  Mono,
  Table,
} from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { DeleteConfirm } from "~/components/DeleteConfirm";
import { SettingsHeader } from "~/components/SettingsHeader";
import { type ApiKey, createApiKey, listApiKeys, revokeApiKey } from "~/data";
import type { Route } from "./+types/settings.keys";

export function meta() {
  return [{ title: "API keys — apitoolchain" }];
}

export async function loader() {
  return { keys: await listApiKeys() };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "create") {
    return createApiKey(String(form.get("name") ?? "").trim());
  }
  if (intent === "revoke") {
    return revokeApiKey(String(form.get("id") ?? ""));
  }
  return { ok: false as const, message: "Unknown action" };
}

export default function SettingsKeysRoute({
  loaderData,
}: Route.ComponentProps) {
  const { keys } = loaderData;
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <SettingsHeader active="keys" />
      <div className="flex max-w-4xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <p className="max-w-[46ch] text-sm text-subtle">
            API keys authenticate requests to the apitoolchain API — CI,
            scripts, and integrations. Treat them like passwords; a key's secret
            is shown only once, at creation.
          </p>
          <div className="shrink-0">
            <Button
              variant="primary"
              icon="plus"
              onClick={() => setCreateOpen(true)}
            >
              Create API key
            </Button>
          </div>
        </div>

        {keys.length === 0 ? (
          <EmptyState
            icon="key"
            title="No API keys yet"
            description="Create a key to call the apitoolchain API from CI or your scripts."
          />
        ) : (
          <Table columns={KEY_COLUMNS} rows={keys} getRowKey={(k) => k.id} />
        )}
      </div>

      <CreateApiKeyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}

const KEY_COLUMNS: Column<ApiKey>[] = [
  {
    key: "name",
    header: "Name",
    width: "wide",
    render: (k) => <span className="font-medium text-ink">{k.name}</span>,
  },
  {
    key: "key",
    header: "Key",
    width: "lg",
    render: (k) => <Mono tone="muted">{k.prefix}••••</Mono>,
  },
  {
    key: "created",
    header: "Created",
    width: "md",
    render: (k) => <span className="text-subtle">{k.createdAt}</span>,
  },
  {
    key: "lastUsed",
    header: "Last used",
    width: "md",
    render: (k) => (
      <span className="text-subtle">{k.lastUsedAt ?? "Never used"}</span>
    ),
  },
  {
    key: "actions",
    header: "",
    width: "sm",
    align: "right",
    render: (k) => <RevokeCell apiKey={k} />,
  },
];

/** The Revoke action cell — its own component so the delete fetcher/state is
 * per-row (a Table `render` can't hold hooks itself). */
function RevokeCell({ apiKey }: { apiKey: ApiKey }) {
  const del = useFetcher();
  const removing = del.state !== "idle";
  const res = del.data as { ok?: boolean; message?: string } | undefined;
  return (
    <DeleteConfirm
      title="Revoke API key"
      description={`Revoke "${apiKey.name}"? Anything using this key stops working immediately.`}
      warning="This can't be undone."
      confirmLabel="Revoke"
      confirming={removing}
      busyLabel="Revoking…"
      error={res && res.ok === false ? res.message : undefined}
      onConfirm={() =>
        del.submit({ intent: "revoke", id: apiKey.id }, { method: "post" })
      }
      trigger={(open) => (
        <Button variant="ghost" size="sm" onClick={open}>
          Revoke
        </Button>
      )}
    />
  );
}

function CreateApiKeyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const fetcher = useFetcher();
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const submitting = fetcher.state !== "idle";
  const submitted = useRef(false);
  const result = fetcher.data as
    | { ok?: boolean; secret?: string; message?: string }
    | undefined;
  const secret =
    submitted.current && result?.ok ? (result.secret ?? null) : null;
  const error =
    submitted.current && result && result.ok === false ? result.message : null;

  useEffect(() => {
    if (open) {
      setName("");
      setCopied(false);
      submitted.current = false;
    }
  }, [open]);

  function create() {
    if (!name.trim() || submitting) return;
    submitted.current = true;
    fetcher.submit({ intent: "create", name: name.trim() }, { method: "post" });
  }

  async function copy() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      // clipboard blocked — the user can still select + copy manually
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={secret ? "API key created" : "Create API key"}
      footer={
        secret ? (
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={create}
              disabled={!name.trim() || submitting}
            >
              {submitting ? "Creating…" : "Create key"}
            </Button>
          </>
        )
      }
    >
      {secret ? (
        <div className="flex flex-col gap-4">
          <Callout tone="warning">
            Copy this key now — you won't be able to see it again.
          </Callout>
          <div className="flex items-center gap-2 rounded-control border border-line bg-surface-muted px-3 py-2.5">
            <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-ink">
              {secret}
            </code>
            <div className="shrink-0">
              <Button
                variant="secondary"
                size="sm"
                icon={copied ? "check" : undefined}
                onClick={copy}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Field
            label="Key name"
            required
            hint="A label to recognize this key later (e.g. “CI”, “prod backend”)."
          >
            <Input value={name} onChange={setName} placeholder="CI pipeline" />
          </Field>
          {error && <Callout tone="error">{error}</Callout>}
        </div>
      )}
    </Modal>
  );
}
