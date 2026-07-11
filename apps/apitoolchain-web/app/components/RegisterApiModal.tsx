import {
  Button,
  Callout,
  ComboboxMenu,
  type ComboboxMenuOption,
  Field,
  Icon,
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

/** URL/id-safe slug (mirrors the registry-api `slugify`). */
function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "api"
  );
}

const ADJECTIVES = [
  "helical",
  "amber",
  "lucid",
  "nimble",
  "cobalt",
  "crisp",
  "vivid",
  "quiet",
  "swift",
  "gentle",
  "bold",
  "cosmic",
  "brave",
  "solar",
  "arctic",
  "ember",
];
const NOUNS = [
  "client",
  "harbor",
  "meadow",
  "cipher",
  "atlas",
  "quartz",
  "delta",
  "willow",
  "summit",
  "orbit",
  "beacon",
  "pixel",
  "canyon",
  "vertex",
  "lagoon",
  "comet",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * A GCP-style identity: a friendly two-word display name plus a random suffix
 * for the id. The suffix keeps the id stable + unique so the title (name) can
 * be renamed freely without changing the id — e.g. name "Helical Client",
 * suffix "501700-h5" → id "helical-client-501700-h5".
 */
function generateApiIdentity(): { name: string; suffix: string } {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const num = 100000 + Math.floor(Math.random() * 900000);
  const tail =
    "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)] +
    Math.floor(Math.random() * 10);
  return {
    name: `${cap(pick(ADJECTIVES))} ${cap(pick(NOUNS))}`,
    suffix: `${num}-${tail}`,
  };
}

export function RegisterApiModal({
  open,
  onClose,
  onImported,
  kind = "api",
  namespaces = [],
  defaultNamespace,
  newVersion,
  distTagOptions = [],
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
  newVersion?: {
    name: string;
    namespace: string;
    format?: string;
    /** The existing entry's id — sent as-is so a new version targets it (the id
     * may be decoupled from the name, so it can't be re-derived from `name`). */
    id?: string;
  };
  /** The API's currently-available dist-tags, offered when choosing one for the
   * new version (alongside `latest`, a typed custom tag, and "No dist-tag"). */
  distTagOptions?: string[];
}) {
  const isSchema = kind === "schema";
  const noun = isSchema ? "schema" : "API";
  const versionOnly = Boolean(newVersion);
  const fetcher = useFetcher();
  const [name, setName] = useState("");
  const [ns, setNs] = useState("");
  // Project id — decoupled from the display name. `idSuffix` is the random tail
  // that decorates the AUTO-GENERATED name only; once the user types their own
  // name (`nameTouched`), the id becomes exactly slugify(name). Revealing +
  // editing the id field (`idEditing`) makes `customId` win outright.
  const [idSuffix, setIdSuffix] = useState("");
  const [customId, setCustomId] = useState("");
  const [idEditing, setIdEditing] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  // Managed namespaces (client store); read after open. Merged with the entry
  // namespaces passed in so the picker is never missing an existing one.
  const [managed, setManaged] = useState<string[]>([]);
  const nsKey = namespaces.join(",");
  const nsOptions = [...new Set([...namespaces, ...managed])].sort();
  const [format, setFormat] = useState("openapi");
  const [mode, setMode] = useState("Paste");
  const [specText, setSpecText] = useState("");
  const [url, setUrl] = useState("");
  // Dist-tag this version publishes under. `latest` (default) makes it current;
  // another tag (canary, beta…) adds it without moving latest/current.
  const [distTag, setDistTag] = useState("latest");

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
    setDistTag("latest");
    // Version-only: identity is inherited from the existing spec.
    if (newVersion) {
      setName(newVersion.name);
      setNs(newVersion.namespace);
      if (newVersion.format) setFormat(newVersion.format);
      return;
    }
    // Fresh import: auto-generate a name + a stable id suffix (both editable).
    const identity = generateApiIdentity();
    setName(identity.name);
    setIdSuffix(identity.suffix);
    setCustomId("");
    setIdEditing(false);
    setNameTouched(false);
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
      setCustomId("");
      setIdEditing(false);
    }
  }, [fetcher.state, result, onClose, onImported]);

  // The auto-generated placeholder name carries a random suffix
  // (helical-client-501700-h5); the moment the user types their own name the id
  // becomes exactly slugify(name) — no random tail. Editing the id field wins
  // over both. Either way it's slugified so the preview matches what's stored.
  const derivedId = nameTouched
    ? slugify(name)
    : `${slugify(name)}-${idSuffix}`;
  const projectId = slugify(idEditing ? customId : derivedId);

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
        // Version-only re-targets the existing entry by its id; a fresh import
        // sends the (decoupled) project id.
        ...(versionOnly
          ? newVersion?.id
            ? { id: newVersion.id }
            : {}
          : { id: projectId }),
        ns,
        kind,
        format: isSchema ? "jsonschema" : format,
        // "none" is a sentinel — register the version WITHOUT creating/moving a
        // dist-tag. Anything else falls back to `latest`.
        distTag: distTag === "none" ? "none" : distTag.trim() || "latest",
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
          <div className="flex flex-col gap-3">
            <div className="rounded-control border border-line bg-surface-muted px-3 py-2 text-[13px] text-subtle">
              New version of{" "}
              <span className="font-medium text-ink">{name}</span> in{" "}
              <span className="font-mono text-ink">@{ns}</span>
            </div>
            <Field
              label="Dist-tag"
              hint="latest becomes the current version. Any other tag (canary, beta…) is added without moving latest. Choose “No dist-tag” to add the version untagged."
            >
              <ComboboxMenu
                options={[
                  {
                    value: "none",
                    label: "No dist-tag",
                    exclusive: true,
                    icon: "close",
                  },
                  ...[...new Set(["latest", ...distTagOptions])].map(
                    (t) =>
                      ({
                        value: t,
                        icon: "tags-outline",
                      }) satisfies ComboboxMenuOption,
                  ),
                ]}
                selected={[distTag]}
                onSelect={setDistTag}
                allowCustom
                closeOnSelect
                searchPlaceholder="Find or create a dist-tag…"
              >
                {({ toggle }) => (
                  <button
                    type="button"
                    onClick={toggle}
                    className="relative flex h-[38px] w-full cursor-pointer items-center rounded-control border border-line bg-surface pr-9 pl-3 text-left text-sm"
                  >
                    <span
                      className={distTag === "none" ? "text-muted" : "text-ink"}
                    >
                      {distTag === "none" ? "No dist-tag" : distTag}
                    </span>
                    <Icon
                      icon="chevronUpDown"
                      size={14}
                      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
                    />
                  </button>
                )}
              </ComboboxMenu>
            </Field>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <Field label="Name" required>
                <Input
                  value={name}
                  onChange={(v) => {
                    setName(v);
                    setNameTouched(true);
                  }}
                  placeholder="Petstore"
                />
              </Field>
              {/* Registry ID — decoupled from the title. Collapsed, it auto-
                  derives from the name; clicking Edit opens a normal field where
                  the id is set explicitly (and no longer follows the name). */}
              {idEditing ? (
                <Field label="Registry ID" required>
                  <Input
                    value={customId}
                    onChange={setCustomId}
                    placeholder={derivedId}
                  />
                </Field>
              ) : (
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="text-subtle">Registry ID:</span>
                  <span className="font-mono text-ink">{projectId}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomId(projectId);
                      setIdEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            <div className={isSchema ? "" : "grid grid-cols-2 gap-4"}>
              <Field
                label="Namespace"
                required
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

        <Field label={isSchema ? "Schema source" : "Spec source"} required>
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
