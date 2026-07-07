import {
  Badge,
  Button,
  Callout,
  Field,
  Input,
  LangIcon,
  Modal,
  OptionCard,
  RadioButtonCard,
  Search,
  Select,
  ToggleTile,
} from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import type { RegistryEntry, SdkLanguage } from "~/data";
import { formatVersion } from "~/version";
import { RegisterApiModal } from "./RegisterApiModal";
import { COMING_SOON_LANGS, SDK_LANGS, SdkLangIcon } from "./SdkLangIcon";

type GenerateResult =
  | { ok: true; sdkId: string }
  | { ok: false; message: string };

/**
 * Selected-API chip shown at the top of steps 2 & 3. When `onChange` is given
 * the whole chip is clickable (→ back to API selection); when it's omitted (the
 * API is locked by the caller) the chip is static and shows no Change action.
 */
function ApiChip({
  api,
  onChange,
}: {
  api: RegistryEntry;
  onChange?: () => void;
}) {
  const body = (
    <>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-ink">
          {api.name}
        </span>
        <span className="truncate text-xs text-subtle">
          {api.namespace}/{api.id}
        </span>
      </div>
      {onChange && <span className="shrink-0 text-xs text-muted">Change</span>}
    </>
  );
  const cls =
    "mb-6 flex items-center gap-3 rounded-control border border-line bg-surface px-3 py-2 text-left";
  if (!onChange) {
    return <div className={cls}>{body}</div>;
  }
  return (
    <button
      type="button"
      onClick={onChange}
      className={`${cls} transition-colors hover:bg-surface-muted`}
    >
      {body}
    </button>
  );
}

export function GenerateSdkModal({
  open,
  onClose,
  apis,
  lockedApiId,
}: {
  open: boolean;
  onClose: () => void;
  /** All registry entries; only OpenAPI specs can generate SDKs. */
  apis: RegistryEntry[];
  /**
   * Pre-chosen, locked API. When set (e.g. opened from a registry page already
   * scoped to one API), the wizard skips API selection: it opens on step 2 and
   * the API can't be changed. Ignored if the id isn't a generatable OpenAPI spec.
   */
  lockedApiId?: string;
}) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  // Freshly-imported APIs (from the nested import flow) are merged in so they're
  // selectable immediately, before the parent loader revalidates.
  const [imported, setImported] = useState<RegistryEntry[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const openapi = [
    ...imported.filter(
      (e) => e.format === "openapi" && !apis.some((a) => a.id === e.id),
    ),
    ...apis.filter((a) => a.format === "openapi"),
  ];
  const locked = lockedApiId
    ? openapi.find((a) => a.id === lockedApiId)
    : undefined;

  const [step, setStep] = useState<1 | 2 | 3>(locked ? 2 : 1);
  const [apiId, setApiId] = useState(locked?.id ?? "");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [version, setVersion] = useState("");
  const [langs, setLangs] = useState<Set<SdkLanguage>>(new Set());

  const submitting = fetcher.state !== "idle";
  const result = fetcher.data as GenerateResult | undefined;
  const submitted = useRef(false);
  const [dirty, setDirty] = useState(false);
  const error = dirty && result && !result.ok ? result.message : null;

  // Reset the wizard each time it opens (starting on step 2 when API-locked).
  useEffect(() => {
    if (open) {
      setStep(locked ? 2 : 1);
      setApiId(locked?.id ?? "");
      setSearch("");
      setName("");
      setNameTouched(false);
      setVersion("");
      setLangs(new Set());
      setDirty(false);
      setImportOpen(false);
      setImported([]);
    }
  }, [open, locked]);

  // Navigate to the new SDK's detail once it's created.
  useEffect(() => {
    if (submitted.current && fetcher.state === "idle" && result?.ok) {
      submitted.current = false;
      onClose();
      navigate(`/sdks/${result.sdkId}`);
    }
  }, [fetcher.state, result, onClose, navigate]);

  const selected = openapi.find((a) => a.id === apiId);
  // Default the SDK name from the API until the user edits it.
  const sdkName = nameTouched ? name : selected ? `${selected.name} SDK` : "";
  // Version to generate from — defaults to the API's current version.
  const currentVer =
    selected?.versions.find((v) => v.current)?.version ??
    selected?.versions[0]?.version ??
    "";
  const genVersion = version || currentVer;
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the pick when the API changes
  useEffect(() => setVersion(""), [apiId]);
  const filtered = openapi.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      `${a.namespace}/${a.id}`.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleLang(l: SdkLanguage) {
    setLangs((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  }

  function generate() {
    if (!selected || langs.size === 0 || submitting || !sdkName.trim()) return;
    submitted.current = true;
    setDirty(true);
    fetcher.submit(
      {
        intent: "generate-sdk",
        apiId,
        name: sdkName.trim(),
        version: genVersion,
        langs: [...langs].join(","),
      },
      { method: "post", action: "/sdks" },
    );
  }

  const footer =
    step === 1 ? (
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          iconRight="arrowUpRight"
          disabled={!selected}
          onClick={() => setStep(2)}
        >
          Continue
        </Button>
      </>
    ) : step === 2 ? (
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
    ) : (
      <>
        <Button variant="secondary" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          icon="sdk"
          disabled={langs.size === 0 || submitting || !sdkName.trim()}
          onClick={generate}
        >
          {submitting ? "Generating…" : `Generate ${langs.size || ""}`.trim()}
        </Button>
      </>
    );

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="sm"
        title="Generate SDKs"
        footer={footer}
      >
        {step === 1 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink">
                Select an API
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <Search
                  value={search}
                  onChange={setSearch}
                  placeholder="Search…"
                  className="w-40"
                />
                <Button
                  variant="ghost"
                  icon="registry"
                  onClick={() => setImportOpen(true)}
                >
                  Import API
                </Button>
              </div>
            </div>
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="rounded-control border border-line px-3 py-8 text-center text-sm text-subtle">
                  No OpenAPI specs found. Import one to generate SDKs.
                </div>
              ) : (
                filtered.map((a) => (
                  <RadioButtonCard
                    key={a.id}
                    selected={a.id === apiId}
                    onSelect={() => setApiId(a.id)}
                    title={a.name}
                    description={`${a.namespace}/${a.id}`}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {step === 2 && selected && (
          <div className="flex flex-col">
            <ApiChip
              api={selected}
              onChange={locked ? undefined : () => setStep(1)}
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">
                How do you want to start?
              </span>
              <div className="grid grid-cols-2 gap-2">
                <OptionCard
                  title="Start fresh"
                  description="Pick the languages to generate."
                  media={
                    <>
                      <SdkLangIcon language="node" />
                      <SdkLangIcon language="python" />
                      <SdkLangIcon language="go" />
                    </>
                  }
                  onClick={() => setStep(3)}
                />
                <OptionCard
                  title="Import config"
                  description="Bring an SDK config. Coming soon."
                  media={<LockGlyph />}
                  disabled
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && selected && (
          <div className="flex flex-col">
            <ApiChip
              api={selected}
              onChange={locked ? undefined : () => setStep(1)}
            />
            <Field label="SDK name">
              <Input
                value={sdkName}
                onChange={(v) => {
                  setNameTouched(true);
                  setName(v);
                }}
                placeholder={`${selected.name} SDK`}
              />
            </Field>
            <div className="mt-4">
              <Field
                label="Version"
                hint="Which spec version to generate the SDK from."
              >
                <Select
                  value={genVersion}
                  onChange={setVersion}
                  leadingIcon="tags-outline"
                  options={selected.versions.map((v) => ({
                    value: v.version,
                    label: v.current
                      ? `${formatVersion(v.version)} (current)`
                      : formatVersion(v.version),
                  }))}
                />
              </Field>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">
                Select SDK languages
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SDK_LANGS.map((l) => (
                  <ToggleTile
                    key={l.value}
                    checked={langs.has(l.value)}
                    onChange={() => toggleLang(l.value)}
                    leading={<SdkLangIcon language={l.value} />}
                    label={l.label}
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">Coming soon</span>
              <div className="grid grid-cols-2 gap-2">
                {COMING_SOON_LANGS.map((l) => (
                  <ToggleTile
                    key={l.icon}
                    disabled
                    leading={
                      <LangIcon name={l.icon} className="size-5 shrink-0" />
                    }
                    label={l.label}
                    trailing={<Badge tone="neutral">Soon</Badge>}
                  />
                ))}
              </div>
            </div>
            {error && (
              <div className="mt-4">
                <Callout tone="error">{error}</Callout>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Nested import flow: import an API, then resume here with it selected. */}
      <RegisterApiModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        namespaces={[...new Set(apis.map((a) => a.namespace))]}
        onImported={(api) => {
          setImportOpen(false);
          setImported((prev) => [api, ...prev]);
          // Imported an OpenAPI spec → choose it and move to the next step.
          if (api.format === "openapi") {
            setApiId(api.id);
            setStep(2);
          }
        }}
      />
    </>
  );
}

/** Small lock glyph for the disabled "Import config" card. */
function LockGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      className="size-5 shrink-0 text-muted"
      aria-hidden="true"
    >
      <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Zm-68-56a12,12,0,1,1-12-12A12,12,0,0,1,140,152Z" />
    </svg>
  );
}
