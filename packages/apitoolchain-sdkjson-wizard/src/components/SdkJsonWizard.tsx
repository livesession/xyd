import { Segmented } from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { defaultSdkJson } from "../model/defaults";
import type {
  GeneratePreview,
  PreviewFile,
  PreviewOperation,
  PreviewResult,
  SdkJson,
  SdkLanguage,
} from "../model/types";
import { LANGUAGE_META, SDK_LANGUAGES } from "../model/types";
import { PreviewPanel } from "./PreviewPanel";
import { SdkForm } from "./SdkForm";
import { SdkJsonEditor } from "./SdkJsonEditor";

const SECTION_KEYS = new Set(
  SDK_LANGUAGES.map((l) => LANGUAGE_META[l].sectionKey),
);

/** Multi-repo: each language's sdk.json holds ONLY that language's section
 * (plus the shared globals). Project the full config down to the active one. */
function projectForRepo(full: SdkJson, activeKey: string): SdkJson {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(full))
    if (!SECTION_KEYS.has(k) || k === activeKey) out[k] = v;
  return out as SdkJson;
}

/** Merge a per-repo edit back into the full config, keeping other languages. */
function mergeFromRepo(
  edited: SdkJson,
  full: SdkJson,
  activeKey: string,
): SdkJson {
  const merged: Record<string, unknown> = { ...edited };
  for (const [k, v] of Object.entries(full))
    if (SECTION_KEYS.has(k) && k !== activeKey) merged[k] = v;
  return merged as SdkJson;
}

/** A good generation snapshot the "Changes" diff compares against — files plus
 * the per-operation usage (so the endpoint switcher diffs each op's own prev). */
type Baseline = {
  files: PreviewFile[];
  usage?: string;
  operations?: PreviewOperation[];
};

export interface SdkJsonWizardProps {
  /** Controlled sdk.json value. */
  value?: SdkJson;
  /** Uncontrolled initial value (defaults to a seeded acme sdk.json). */
  defaultValue?: SdkJson;
  onChange?: (sdk: SdkJson) => void;
  /** The async boundary that runs the real emitters (SB middleware / web route). */
  generatePreview: GeneratePreview;
  /** Which bundled sample spec to generate from. */
  specId?: string;
  /** Languages offered in the switcher (default: all 6). */
  languages?: SdkLanguage[];
  /** Debounce (ms) before re-generating the preview on an edit. Default 250. */
  debounceMs?: number;
  /** Form section ids open by default (default: none open). */
  defaultOpenSections?: string[];
  /** Pin the language switcher / Form-JSON toggle / preview while scrolling
   * (default true). Turn OFF when embedding inside your own scroll container
   * (e.g. a modal), where the sticky offsets tuned for full-page scroll don't
   * fit. */
  sticky?: boolean;
  /** Contained layout: fill the parent's height with a fixed top bar and two
   * independently-scrolling columns — for a fixed-height container (e.g. a modal)
   * where you want the preview to stay put while a long form scrolls. Takes
   * precedence over `sticky`. */
  fill?: boolean;
  /** Which editor to show first — the UI "form" (default) or raw "json". */
  defaultEditMode?: "form" | "json";
  /** Repo layout the wizard opens in: "mono" (one config, all languages,
   * default) or "multi" (one config per language). */
  defaultRepoMode?: "mono" | "multi";
  /**
   * What the "Changes" diff compares each generation against:
   * - "previous" (default) — the generation right before it, so each edit's
   *   incremental effect shows.
   * - "initial" — the FIRST generation (state 0, the config the wizard opened
   *   with), so the diff always shows the CUMULATIVE change from the baseline.
   */
  diffBase?: "previous" | "initial";
  /** Field paths the host fixes (e.g. `sdkName`/`version`/`api`) — hidden from
   * the Form (a section left empty is skipped). They stay in the JSON config. */
  readOnlyFields?: string[];
}

export function SdkJsonWizard({
  value,
  defaultValue,
  onChange,
  generatePreview,
  specId,
  languages = [...SDK_LANGUAGES],
  debounceMs = 250,
  defaultOpenSections,
  sticky = true,
  fill = false,
  defaultEditMode = "form",
  defaultRepoMode = "mono",
  diffBase = "previous",
  readOnlyFields,
}: SdkJsonWizardProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<SdkJson>(
    () => value ?? defaultValue ?? defaultSdkJson(),
  );
  const sdkJson = controlled ? value : internal;
  const [activeLanguage, setActiveLanguage] = useState<SdkLanguage>(
    languages[0],
  );
  // Edit the config via the UI form, or directly as JSON.
  const [editMode, setEditMode] = useState<"form" | "json">(defaultEditMode);
  // Monorepo = one sdk.json with every chosen language; multi-repo = one config
  // per language (the JSON view shows only the active language's section). The
  // choice is made by the host (a step before the wizard), so it's fixed here.
  const repoMode = defaultRepoMode;
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  // The last GOOD generation per language — the baseline the "Changes" diff
  // compares the next generation against when diffBase === "previous". Carries
  // per-op `operations` too so switching endpoints diffs that op's own prev.
  const lastByLang = useRef<Partial<Record<SdkLanguage, Baseline>>>({});
  // The FIRST good generation per language (state 0) — the fixed baseline used
  // when diffBase === "initial", so the diff is cumulative from the start.
  const initialByLang = useRef<Partial<Record<SdkLanguage, Baseline>>>({});
  const [previous, setPrevious] = useState<Baseline | null>(null);
  // Put the default editor's mode first in the toggle (web opens JSON-first).
  const editOptions =
    defaultEditMode === "json" ? ["JSON", "Form"] : ["Form", "JSON"];
  // Page-sticky positioning applies only outside the contained (fill) layout.
  const pin = !fill && sticky;

  const update = (next: SdkJson) => {
    if (!controlled) setInternal(next);
    onChange?.(next);
  };

  // Multi-repo: the JSON view shows only the active language's section; edits
  // merge back so switching languages doesn't drop the other languages.
  const activeSectionKey = LANGUAGE_META[activeLanguage].sectionKey;
  const jsonView =
    repoMode === "multi" ? projectForRepo(sdkJson, activeSectionKey) : sdkJson;
  const onJsonChange = (next: SdkJson) =>
    update(
      repoMode === "multi"
        ? mergeFromRepo(next, sdkJson, activeSectionKey)
        : next,
    );

  // Debounced live preview: any edit / language switch re-runs the real emitter.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      void generatePreview({ language: activeLanguage, sdkJson, specId }).then(
        (res) => {
          if (cancelled) return;
          // The diff baseline (same language): the prior generation for an
          // incremental "previous" diff, or the fixed first one for "initial".
          setPrevious(
            (diffBase === "initial" ? initialByLang : lastByLang).current[
              activeLanguage
            ] ?? null,
          );
          setResult(res);
          setLoading(false);
          if (!res.error) {
            const snap = {
              files: res.files,
              usage: res.usage,
              operations: res.operations,
            };
            lastByLang.current[activeLanguage] = snap;
            // Capture the first good generation as the state-0 baseline.
            initialByLang.current[activeLanguage] ??= snap;
          }
        },
      );
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [sdkJson, activeLanguage, specId, generatePreview, debounceMs, diffBase]);

  return (
    <div
      className={`${
        fill ? "flex min-h-0 flex-1 flex-col" : "flex flex-col"
      } gap-4 text-body`}
    >
      {/* Top bar mirrors the two content columns: Form/JSON over the editor
          (left, left-aligned), languages centered over the preview (right). In
          fill it's a fixed flex child; otherwise it pins on page scroll. */}
      <div
        className={`grid grid-cols-1 gap-5 py-2 lg:grid-cols-[minmax(440px,600px)_1fr] ${
          pin ? "sticky top-0 z-20 bg-surface" : ""
        }`}
      >
        <div className="flex items-center">
          <Segmented
            options={editOptions}
            value={editMode === "form" ? "Form" : "JSON"}
            onChange={(v) => setEditMode(v === "JSON" ? "json" : "form")}
          />
        </div>
        <div className="flex items-center justify-center">
          <Segmented
            options={languages.map((l) => LANGUAGE_META[l].label)}
            value={LANGUAGE_META[activeLanguage].label}
            onChange={(label) => {
              const lang = languages.find(
                (l) => LANGUAGE_META[l].label === label,
              );
              if (lang) setActiveLanguage(lang);
            }}
          />
        </div>
      </div>
      <div
        className={`grid grid-cols-1 gap-5 lg:grid-cols-[minmax(440px,600px)_1fr] ${
          fill ? "min-h-0 flex-1" : ""
        }`}
      >
        <div
          className={`flex min-w-0 flex-col ${
            fill ? "min-h-0 overflow-auto" : ""
          }`}
        >
          {editMode === "form" ? (
            <SdkForm
              sdkJson={sdkJson}
              activeLanguage={activeLanguage}
              onChange={update}
              formNonce={0}
              openSections={defaultOpenSections}
              readOnlyFields={readOnlyFields}
            />
          ) : (
            <SdkJsonEditor
              key={repoMode === "multi" ? activeSectionKey : "mono"}
              sdkJson={jsonView}
              onChange={onJsonChange}
            />
          )}
        </div>
        <div
          className={`min-w-0 ${
            fill
              ? "flex min-h-0 flex-col"
              : pin
                ? "lg:sticky lg:top-14 lg:self-start"
                : ""
          }`}
        >
          <PreviewPanel
            result={result}
            loading={loading}
            language={activeLanguage}
            previousFiles={previous?.files ?? null}
            previousUsage={previous?.usage}
            previousOperations={previous?.operations ?? null}
            sticky={pin}
            fill={fill}
          />
        </div>
      </div>
    </div>
  );
}
