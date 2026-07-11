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
import {
  createFetchPreview,
  type SdkJson,
  SdkJsonWizard,
  seedSdkJson,
} from "@apitoolchain/sdkjson-wizard";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import type { RegistryEntry, SdkLanguage } from "~/data";
import { formatVersion } from "~/version";
import { RegisterApiModal } from "./RegisterApiModal";
import { COMING_SOON_LANGS, SDK_LANGS, SdkLangIcon } from "./SdkLangIcon";

/** The wizard's live preview runs the real opensdk emitters via a server route. */
const fetchPreview = createFetchPreview("/api/sdk-preview");

type GenerateResult =
  | { ok: true; sdkId: string }
  | { ok: false; message: string };

/** URL/id-safe slug (mirrors the platform-api `slugify`). */
function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "sdk"
  );
}

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
  existingSdkIds,
}: {
  open: boolean;
  onClose: () => void;
  /** All registry entries; only OpenAPI specs can generate SDKs. */
  apis: RegistryEntry[];
  /** Ids of existing SDKs — to warn before creating a duplicate (the id is the
   * SDK's primary key, so a clash would fail server-side anyway). */
  existingSdkIds?: string[];
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
  // SDK id — decoupled from the display name (same pattern as the registry's
  // Registry ID). Collapsed, it tracks slugify(name); revealing + editing the id
  // field (`idEditing`) pins `customId` and stops it following the name.
  const [customId, setCustomId] = useState("");
  const [idEditing, setIdEditing] = useState(false);
  const [version, setVersion] = useState("");
  const [langs, setLangs] = useState<Set<SdkLanguage>>(new Set());
  // "auto" = derived defaults; "wizard" = a custom sdk.json built in the wizard.
  const [mode, setMode] = useState<"auto" | "wizard">("auto");
  const [wizardOpen, setWizardOpen] = useState(false);
  // Repo-layout step shown between "Go to wizard" and the wizard.
  const [repoChoiceOpen, setRepoChoiceOpen] = useState(false);
  const [repoMode, setRepoMode] = useState<"mono" | "multi">("multi");
  const [wizardSdkJson, setWizardSdkJson] = useState<SdkJson | null>(null);
  // The repoMode the current wizardSdkJson was seeded with — re-seed only when it
  // changes, so returning to the wizard doesn't clobber edits.
  const seededRepoMode = useRef<"mono" | "multi" | null>(null);

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
      setCustomId("");
      setIdEditing(false);
      setVersion("");
      setLangs(new Set());
      setMode("auto");
      setWizardOpen(false);
      setRepoChoiceOpen(false);
      setRepoMode("multi");
      setWizardSdkJson(null);
      seededRepoMode.current = null;
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
  // The id follows slugify(name) until the id field is explicitly edited.
  const sdkId = slugify(idEditing ? customId : sdkName);
  // Ids are the SDK primary key — warn (+ block) before creating a duplicate.
  const idTaken = (existingSdkIds ?? []).includes(sdkId);
  // Version to generate from — defaults to the API's current version.
  const currentVer =
    selected?.versions.find((v) => v.current)?.version ??
    selected?.versions[0]?.version ??
    "";
  const genVersion = version || currentVer;
  // Selected languages in the "Select SDK languages" display order (SDK_LANGS),
  // NOT the Set's click order — so the wizard switcher + sdk.json sections match.
  const orderedLangs = SDK_LANGS.map((l) => l.value).filter((v) =>
    langs.has(v),
  );

  // Seed the wizard from the REAL SDK info — only the chosen languages, package
  // names derived from the SDK name. In multi-repo each language's output is the
  // repo root (".").
  const buildSeed = (rm: "mono" | "multi") =>
    seedSdkJson({
      sdkName: sdkName.trim() || "SDK",
      languages: orderedLangs,
      slug: sdkId,
      namespace: selected?.namespace,
      version: "0.1.0",
      repoMode: rm,
      api: selected
        ? `apis/${selected.namespace}/${selected.id}@${genVersion}`
        : undefined,
      sdk: selected ? `sdks/${selected.namespace}/${sdkId}@0.1.0` : undefined,
    });
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

  function generate(customSdkJson?: SdkJson) {
    if (
      !selected ||
      langs.size === 0 ||
      submitting ||
      !sdkName.trim() ||
      idTaken
    )
      return;
    submitted.current = true;
    setDirty(true);
    fetcher.submit(
      {
        intent: "generate-sdk",
        apiId,
        name: sdkName.trim(),
        id: sdkId,
        version: genVersion,
        langs: orderedLangs.join(","),
        // The wizard's custom sdk.json, applied per target; omitted in auto mode.
        ...(customSdkJson ? { sdkJson: JSON.stringify(customSdkJson) } : {}),
      },
      { method: "post", action: "/sdks" },
    );
    setWizardOpen(false);
  }

  const footer =
    step === 1 ? (
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          iconRight="arrowRight"
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
          iconRight={mode === "wizard" ? "arrowRight" : undefined}
          disabled={
            langs.size === 0 || submitting || !sdkName.trim() || idTaken
          }
          onClick={
            mode === "wizard" ? () => setRepoChoiceOpen(true) : () => generate()
          }
        >
          {mode === "wizard"
            ? "Go to wizard"
            : submitting
              ? "Generating…"
              : `Generate ${langs.size || ""}`.trim()}
        </Button>
      </>
    );

  return (
    <>
      <Modal
        open={open && !wizardOpen && !repoChoiceOpen}
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
            <Field label="SDK name" required>
              <Input
                value={sdkName}
                onChange={(v) => {
                  setNameTouched(true);
                  setName(v);
                }}
                placeholder={`${selected.name} SDK`}
              />
            </Field>
            {/* SDK ID — decoupled from the name. Collapsed it auto-derives from
                the name; Edit pins it (and it no longer follows the name). */}
            <div className="mt-2">
              {idEditing ? (
                <Field label="SDK ID" required>
                  <Input
                    value={customId}
                    onChange={setCustomId}
                    placeholder={slugify(sdkName)}
                  />
                </Field>
              ) : (
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="text-subtle">SDK ID:</span>
                  <span className="font-mono text-ink">{sdkId}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomId(sdkId);
                      setIdEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
            {idTaken && (
              <p className="mt-1.5 text-[12px] text-danger">
                An SDK with id <span className="font-mono">{sdkId}</span>{" "}
                already exists — choose a different name or id.
              </p>
            )}
            <div className="mt-4">
              <Field
                label="API version"
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
            {langs.size > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <span className="text-sm font-medium text-ink">
                  SDK configuration
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <OptionCard
                    title="Auto"
                    description="Generate with sensible defaults."
                    selected={mode === "auto"}
                    onClick={() => setMode("auto")}
                  />
                  <OptionCard
                    title="Wizard"
                    description="Customize each language — imports, exports, retries & more."
                    selected={mode === "wizard"}
                    onClick={() => setMode("wizard")}
                  />
                </div>
              </div>
            )}
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

      {/* Repo-layout step: choose one config for all languages (monorepo) or one
          per language (multi-repo) before opening the wizard. */}
      <Modal
        open={repoChoiceOpen}
        onClose={onClose}
        size="md"
        title="Repository layout"
        description="How should the generated SDKs be organized?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRepoChoiceOpen(false)}
            >
              Back
            </Button>
            <Button
              variant="primary"
              iconRight="arrowRight"
              onClick={() => {
                // Seed on first entry or when the layout changed (its output
                // paths differ); otherwise keep the user's edits.
                if (
                  wizardSdkJson == null ||
                  seededRepoMode.current !== repoMode
                ) {
                  setWizardSdkJson(buildSeed(repoMode));
                  seededRepoMode.current = repoMode;
                }
                setRepoChoiceOpen(false);
                setWizardOpen(true);
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <RadioButtonCard
            wrap
            title="Multi-repo"
            description="One config per language — each language ships in its own repository (output at the repo root)."
            selected={repoMode === "multi"}
            onSelect={() => setRepoMode("multi")}
          />
          <RadioButtonCard
            wrap
            title="Monorepo"
            description="One sdk.json with every language, in a single repository."
            selected={repoMode === "mono"}
            onSelect={() => setRepoMode("mono")}
          />
        </div>
      </Modal>

      {/* The wizard: a large modal to build a custom sdk.json per language. Its
          live preview runs the real emitters via /api/sdk-preview. "Generate"
          here sends the captured config. */}
      {wizardOpen && wizardSdkJson && (
        <Modal
          open={wizardOpen}
          onClose={() => {
            setWizardOpen(false);
            setRepoChoiceOpen(true);
          }}
          size="xl"
          fill
          title="Configure your SDKs"
          description="Tune the generated code per language — the preview shows how each option changes the SDK."
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setWizardOpen(false);
                  setRepoChoiceOpen(true);
                }}
              >
                Back
              </Button>
              <Button
                variant="primary"
                icon="sdk"
                disabled={submitting || idTaken}
                onClick={() => generate(wizardSdkJson)}
              >
                {submitting ? "Generating…" : `Generate ${langs.size}`}
              </Button>
            </>
          }
        >
          {/* fill: the wizard fills the fixed-height modal — top bar stays put
              and the form/preview columns scroll independently, so a long form
              never scrolls the usage out of view. */}
          <SdkJsonWizard
            value={wizardSdkJson}
            onChange={setWizardSdkJson}
            languages={orderedLangs}
            generatePreview={fetchPreview}
            fill
            defaultEditMode="form"
            defaultRepoMode={repoMode}
            // Always diff against the initial generation (state 0) so the panel
            // shows the cumulative effect of the config, not just the last edit.
            diffBase="initial"
            // Identity is fixed by this flow — hide it from the Form (it stays
            // in the JSON config, read-only).
            readOnlyFields={["$schema", "version", "sdkName", "api", "sdk"]}
          />
        </Modal>
      )}

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
