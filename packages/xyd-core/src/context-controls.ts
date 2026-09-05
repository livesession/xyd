import type { Metadata } from "./types/metadata";
import type { Navigation, PageURL, Settings } from "./types/settings";
import type {
  ContentVersionOption,
  ContextControl,
  ContextControlAction,
  ContextControlActionName,
  ContextControlAppearance,
  ContextControlContentVersion,
  ContextControls,
} from "./types/context-controls";

// ---------------------------------------------------------------------------
// Page context controls resolver — PURE string/object work (no fs, no DOM):
// runs identically server- and client-side on both engines. The framework's
// `useContextControls()` feeds it `useSettings()` + `useMetadata()` + the
// current slug; themes render the result per appearance slot.
// ---------------------------------------------------------------------------

/** A control normalized to its typed object form (shorthands expanded,
 * defaults filled). `appearance` is always set. */
export type ResolvedContextControl = Exclude<ContextControl, string> & {
  appearance: ContextControlAppearance;
};

const ACTION_NAMES: ContextControlActionName[] = ["copy", "view-markdown", "chatgpt", "claude"];

const DEFAULTS: Record<string, { label: string; icon: string; description: string }> = {
  copy: { label: "Copy page", icon: "copy", description: "Copy the page as Markdown" },
  "view-markdown": { label: "View as Markdown", icon: "file-text", description: "Open the raw Markdown" },
  chatgpt: { label: "Open in ChatGPT", icon: "message-circle", description: "Ask ChatGPT about this page" },
  claude: { label: "Open in Claude", icon: "sparkles", description: "Ask Claude about this page" },
  mcp: { label: "Copy MCP server URL", icon: "server", description: "Connect the docs MCP server" },
  dropdown: { label: "Page actions", icon: "", description: "" },
  "content-version": { label: "", icon: "", description: "" },
  custom: { label: "", icon: "", description: "" },
};

/** Default display metadata for a control type (label/icon/description). */
export function contextControlDefaults(type: string) {
  return DEFAULTS[type] ?? { label: type, icon: "", description: "" };
}

function isActionName(value: unknown): value is ContextControlActionName {
  return typeof value === "string" && (ACTION_NAMES as string[]).includes(value);
}

/** Expand a bare-string shorthand / validate a typed control. Invalid entries
 * (unknown shorthand, mcp without a url, dropdown without controls, …) return
 * null and are dropped. */
function normalizeControl(control: ContextControl): Exclude<ContextControl, string> | null {
  if (typeof control === "string") {
    return isActionName(control) ? { type: control } : null;
  }
  if (!control || typeof control !== "object" || typeof (control as { type?: unknown }).type !== "string") {
    return null;
  }
  switch (control.type) {
    case "copy":
    case "view-markdown":
    case "chatgpt":
    case "claude":
      return control;
    case "mcp":
      return control.options?.url ? control : null;
    case "dropdown": {
      const nested = (control.options?.controls ?? [])
        .map((c) => normalizeControl(c))
        .filter((c): c is ContextControlAction => !!c && c.type !== "dropdown"
          && c.type !== "content-version" && c.type !== "custom");
      if (!nested.length) return null;
      return { ...control, options: { controls: nested } };
    }
    case "content-version": {
      const versions = control.options?.versions ?? [];
      if (!versions.length) return null;
      // one mode per control: every version has `page` (navigate), or no
      // version has `page` and at least one has `source` (same-URL swap; a
      // sourceless version is the host page's own content).
      const navigateMode = versions.every((v) => !!v.page);
      const swapMode = versions.every((v) => !v.page) && versions.some((v) => !!v.source);
      return navigateMode || swapMode ? control : null;
    }
    case "custom":
      return control.component ? control : null;
    default:
      return null;
  }
}

const stripSlash = (s: string) => s.replace(/^\/+/, "");

/** Find the sidebar leaf entry for `slug` carrying `contextControls` — walks
 * `navigation.sidebar` and every `languages[].sidebar`. Leaf forms that carry
 * controls: `{ page, contextControls }` (incl. source pages, normalized or
 * not) and the virtual object form. */
export function findSidebarContextControls(
  navigation: Navigation | undefined | null,
  slug: string,
): ContextControls | undefined {
  if (!navigation) return undefined;
  const want = stripSlash(slug);

  let found: ContextControls | undefined;
  const visit = (entry: PageURL | unknown) => {
    if (found || !entry || typeof entry !== "object") return;
    const e = entry as Record<string, unknown>;
    if (Array.isArray(e.pages)) {
      for (const child of e.pages) visit(child);
      return;
    }
    if (typeof e.page === "string" && Array.isArray(e.contextControls)) {
      if (stripSlash(e.page) === want) found = e.contextControls as ContextControls;
    }
  };

  for (const item of navigation.sidebar || []) visit(item);
  for (const lang of navigation.languages || []) {
    for (const item of lang.sidebar || []) visit(item);
  }
  return found;
}

/**
 * Resolve the context controls for a page. Precedence (REPLACE, not merge):
 * sidebar entry > frontmatter (`metadata.contextControls`) > global
 * (`components.contextControls`). An empty array at a higher level opts the
 * page out entirely. Shorthands are expanded; invalid entries dropped;
 * `appearance` defaults to `"header"`.
 */
export function resolveContextControls(
  settings: Settings | undefined | null,
  metadata: Metadata | undefined | null,
  slug: string,
): ResolvedContextControl[] {
  const fromSidebar = findSidebarContextControls(settings?.navigation, slug);
  const declared =
    fromSidebar ?? metadata?.contextControls ?? settings?.components?.contextControls;
  if (!declared) return [];

  const resolved: ResolvedContextControl[] = [];
  for (const control of declared) {
    const normalized = normalizeControl(control);
    if (!normalized) continue;
    resolved.push({
      ...normalized,
      appearance: normalized.appearance ?? "header",
    });
  }
  return resolved;
}

// ── content-version same-URL swap ───────────────────────────────────────────

export const CONTENT_VERSION_DEFAULT_PARAM = "version";

/** The stable id a version is selected by (`?<queryParam>=<value>`). */
export function contentVersionValue(version: ContentVersionOption): string {
  return version.value ?? version.title.toLowerCase().trim().replace(/\s+/g, "-");
}

/** True when a content-version control runs in same-URL swap mode. */
export function isContentVersionSwap(control: ContextControlContentVersion): boolean {
  const versions = control.options?.versions ?? [];
  return versions.every((v) => !v.page) && versions.some((v) => !!v.source);
}

export interface ContentVersionSwap {
  /** The query param name (configurable via `options.queryParam`). */
  queryParam: string;
  /** The selected version's value. */
  value: string;
  /** The markdown source to compile INSTEAD of the page's own file —
   * undefined when the selected version is the host content. */
  source?: string;
}

/**
 * Loader-side resolution for same-URL content swapping: given the page's
 * resolved controls and the request's query string, which markdown source
 * should render? null when the page has no swap-mode control. Pure — both
 * engines' loaders and the client call it identically.
 */
export function resolveContentVersionSwap(
  settings: Settings | undefined | null,
  metadata: Metadata | undefined | null,
  slug: string,
  search: string | URLSearchParams | undefined | null,
): ContentVersionSwap | null {
  const controls = resolveContextControls(settings, metadata, slug);
  const control = controls.find(
    (c): c is Extract<ResolvedContextControl, { type: "content-version" }> =>
      c.type === "content-version" && isContentVersionSwap(c),
  );
  if (!control) return null;

  const queryParam = control.options.queryParam ?? CONTENT_VERSION_DEFAULT_PARAM;
  const params = typeof search === "string" ? new URLSearchParams(search) : (search ?? new URLSearchParams());
  const requested = params.get(queryParam);

  const versions = control.options.versions;
  const selected = (requested && versions.find((v) => contentVersionValue(v) === requested)) || versions[0];
  return {
    queryParam,
    value: contentVersionValue(selected),
    source: selected.source || undefined,
  };
}
