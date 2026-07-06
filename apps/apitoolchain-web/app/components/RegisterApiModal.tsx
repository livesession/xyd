import {
  Button,
  Callout,
  Field,
  Input,
  Modal,
  Segmented,
  Select,
  Textarea,
} from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import {
  listNamespaces,
  type RegisterApiResult,
  type RegistryEntry,
} from "~/data";

export function RegisterApiModal({
  open,
  onClose,
  onImported,
  kind = "api",
  namespaces = [],
  defaultNamespace,
  newVersion,
}: {
  open: boolean;
  onClose: () => void;
  /** Fired with the created entry on a successful import (before close) — lets a
   * host flow (e.g. Generate SDKs) resume with the freshly-imported API. */
  onImported?: (api: RegistryEntry) => void;
  /** `api` imports an OpenAPI/GraphQL/AsyncAPI spec; `schema` a JSON Schema. */
  kind?: "api" | "schema";
  /** Namespaces already present on entries — merged with the managed set so
   * existing namespaces are always pickable (you pick, not create). */
  namespaces?: string[];
  /** Preselect this namespace (e.g. importing a new version of an existing API). */
  defaultNamespace?: string;
  /**
   * Version-only mode: uploading a NEW VERSION of an existing spec. Name,
   * namespace and format are inherited (locked + hidden) — only the new spec is
   * asked for. Omit for a fresh import.
   */
  newVersion?: { name: string; namespace: string; format?: string };
}) {
  const isSchema = kind === "schema";
  const noun = isSchema ? "schema" : "API";
  const versionOnly = Boolean(newVersion);
  const fetcher = useFetcher();
  const [name, setName] = useState("");
  const [ns, setNs] = useState("");
  // Managed namespaces (client store); read after open. Merged with the entry
  // namespaces passed in so the picker is never missing an existing one.
  const [managed, setManaged] = useState<string[]>([]);
  const nsKey = namespaces.join(",");
  const nsOptions = [...new Set([...namespaces, ...managed])].sort();
  const [format, setFormat] = useState("openapi");
  const [mode, setMode] = useState("Paste");
  const [specText, setSpecText] = useState("");
  const [url, setUrl] = useState("");

  const submitting = fetcher.state !== "idle";
  const result = fetcher.data as RegisterApiResult | undefined;
  // `fetcher.data` persists across close/reopen — only surface an error/close
  // for a submission made in THIS open session, so a stale error/success from a
  // prior attempt doesn't reappear.
  const submitted = useRef(false);
  const [dirty, setDirty] = useState(false);
  const error = dirty && result && !result.ok ? result.message : null;

  // A fresh open clears any stale result + (re)loads the namespace picker.
  // biome-ignore lint/correctness/useExhaustiveDependencies: nsKey is a stable primitive standing in for the `namespaces` array
  useEffect(() => {
    if (!open) return;
    setDirty(false);
    // Version-only: identity is inherited from the existing spec.
    if (newVersion) {
      setName(newVersion.name);
      setNs(newVersion.namespace);
      if (newVersion.format) setFormat(newVersion.format);
      return;
    }
    const ids = listNamespaces().map((n) => n.id);
    setManaged(ids);
    const opts = [...new Set([...namespaces, ...ids])].sort();
    setNs(
      defaultNamespace && opts.includes(defaultNamespace)
        ? defaultNamespace
        : (opts[0] ?? ""),
    );
  }, [open, nsKey, defaultNamespace]);

  // Close + reset once OUR submission succeeds (RR revalidates the list).
  useEffect(() => {
    if (submitted.current && fetcher.state === "idle" && result?.ok) {
      submitted.current = false;
      onImported?.(result.api);
      onClose();
      setName("");
      setNs("");
      setSpecText("");
      setUrl("");
    }
  }, [fetcher.state, result, onClose, onImported]);

  const canSubmit =
    name.trim().length > 0 &&
    ns.length > 0 &&
    (mode === "Paste" ? specText.trim().length > 0 : url.trim().length > 0);

  function submit() {
    if (!canSubmit || submitting) return;
    submitted.current = true;
    setDirty(true);
    fetcher.submit(
      {
        name,
        ns,
        kind,
        format: isSchema ? "jsonschema" : format,
        ...(mode === "Paste" ? { specText } : { url }),
      },
      { method: "post", action: "/registry" },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={versionOnly ? "New version" : `Import ${noun}`}
      description={
        versionOnly
          ? `Upload a new version of this ${noun} — namespace, name and format are inherited.`
          : isSchema
            ? "Import a standalone JSON Schema — versioned and referenceable from the registry."
            : "Import an OpenAPI, GraphQL, or AsyncAPI spec — then generate SDKs, docs, and an MCP server from it."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="plus"
            onClick={submit}
            disabled={!canSubmit || submitting}
          >
            {versionOnly
              ? submitting
                ? "Uploading…"
                : "Upload version"
              : submitting
                ? "Importing…"
                : `Import ${noun}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {versionOnly ? (
          <div className="rounded-control border border-line bg-surface-muted px-3 py-2 text-[13px] text-subtle">
            New version of <span className="font-medium text-ink">{name}</span>{" "}
            in <span className="font-mono text-ink">@{ns}</span>
          </div>
        ) : (
          <>
            <Field label="Name">
              <Input value={name} onChange={setName} placeholder="Petstore" />
            </Field>

            <div className={isSchema ? "" : "grid grid-cols-2 gap-4"}>
              <Field
                label="Namespace"
                hint={
                  isSchema ? "Groups related schemas." : "Groups related APIs."
                }
              >
                <div className="flex flex-col gap-1.5">
                  {nsOptions.length > 0 ? (
                    <Select
                      value={ns}
                      onChange={setNs}
                      options={nsOptions.map((id) => ({
                        value: id,
                        label: `@${id}`,
                      }))}
                    />
                  ) : (
                    <div className="rounded-control border border-line bg-surface-muted px-3 py-2 text-[13px] text-subtle">
                      No namespaces yet — create one to pick it here.
                    </div>
                  )}
                  <Link
                    to="/settings/namespaces"
                    onClick={onClose}
                    className="self-start text-xs text-muted no-underline hover:text-ink"
                  >
                    Manage namespaces →
                  </Link>
                </div>
              </Field>
              {!isSchema && (
                <Field label="Format">
                  <Select
                    value={format}
                    onChange={setFormat}
                    options={[
                      { value: "openapi", label: "OpenAPI" },
                      { value: "graphql", label: "GraphQL" },
                      { value: "asyncapi", label: "AsyncAPI" },
                    ]}
                  />
                </Field>
              )}
            </div>
          </>
        )}

        <Field label={isSchema ? "Schema source" : "Spec source"}>
          <div className="flex flex-col gap-2">
            <Segmented
              options={["Paste", "URL"]}
              value={mode}
              onChange={setMode}
            />
            {mode === "Paste" ? (
              <Textarea
                mono
                rows={10}
                value={specText}
                onChange={setSpecText}
                placeholder={
                  isSchema
                    ? '{\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "title": "Address",\n  "type": "object",\n  "properties": { "street": { "type": "string" } }\n}'
                    : "openapi: 3.0.0\ninfo: { title: Petstore, version: 1.0.0 }\npaths: { /pets: { get: { responses: { '200': { description: ok } } } } }"
                }
              />
            ) : (
              <Input
                value={url}
                onChange={setUrl}
                placeholder={
                  isSchema
                    ? "https://schemas.example.com/address.json"
                    : "https://api.example.com/openapi.yaml"
                }
              />
            )}
          </div>
        </Field>

        {error && <Callout tone="error">{error}</Callout>}
      </div>
    </Modal>
  );
}
