import { Badge, Button, Menu } from "@apitoolchain/design-system";
import Editor from "@monaco-editor/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Atlas, AtlasContext, prewarmReference } from "@xyd-js/atlas";
import {
  Framework,
  FwSidebar,
  SidebarActiveProvider,
} from "@xyd-js/framework/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useFetcher, useNavigate } from "react-router";
import type { RegistryEntry } from "~/data";
import { DOCS_PREFIX, EDITOR_SETTINGS } from "~/lib/xyd/editor-settings";
import { surfaces } from "~/lib/xyd/runtime";

// biome-ignore lint/suspicious/noExplicitAny: xyd runtime props aren't aliased.
type Loose = any;

// xyd's Framework declares required props (e.g. BannerContent) the editor
// doesn't use; cast it so JSX doesn't demand them (apidocs-demo uses it as
// loosely). Its context is what FwSidebar reads.
const FrameworkC = Framework as Loose;

const VARIANT_TOGGLES = [
  { key: "status", defaultValue: "200" },
  { key: "contentType", defaultValue: "application/json" },
];

interface EditorAppProps {
  api: RegistryEntry;
  apis: RegistryEntry[];
  version: string;
  specText: string;
  references: Loose[];
  groups: unknown[];
  error?: string;
}

interface UniformResult {
  references: Loose[];
  groups: unknown[];
  error?: string;
}

/** The sidebar link href the FwSidebar renders for a reference (mapSettingsToProps
 * builds them as `${DOCS_PREFIX}/<canonical>`). */
function refHref(r: Loose): string {
  const c = r.canonical.startsWith("/") ? r.canonical : `/${r.canonical}`;
  return `${DOCS_PREFIX}${c.endsWith("/") ? c.slice(0, -1) : c}`;
}

export default function EditorApp(props: EditorAppProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher<UniformResult>();

  const [references, setReferences] = useState<Loose[]>(props.references);
  const [groups, setGroups] = useState(props.groups);
  const [error, setError] = useState(props.error);
  // When set, forces the active endpoint (a deep-link restore or a sidebar
  // click) regardless of scroll position — released on the first manual scroll.
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);

  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The Atlas preview is the scroll container — the whole spec renders into it
  // and sidebar clicks scroll it to the matching operation.
  const atlasHostRef = useRef<HTMLDivElement>(null);

  // A stable AtlasContext value — so scrolling and unrelated re-renders don't
  // force the visible Atlas rows to re-read context and re-highlight.
  const atlasContext = useMemo(
    () =>
      ({
        syntaxHighlight: EDITOR_SETTINGS.theme.coder.syntaxHighlight,
        baseMatch: DOCS_PREFIX,
        variantToggles: VARIANT_TOGGLES,
        // Code samples: a language dropdown + xyd's built-in language icons.
        codeSample: { languageSwitcher: "dropdown", languageIcons: true },
      }) as Loose,
    [],
  );

  // Virtualize the (potentially ~300) reference sections — only the visible few
  // mount, so a huge spec no longer builds 100k+ DOM nodes / a multi-GB fiber
  // tree. Dynamic heights via `measureElement` (ResizeObserver): ApiRefItem
  // heights vary and grow once codehike finishes highlighting. Same tech as
  // @ide0/chat-messenger's virtualized turn list.
  const virtualizer = useVirtualizer({
    count: references.length,
    getScrollElement: () => atlasHostRef.current,
    estimateSize: () => 600,
    overscan: 3,
    paddingStart: 20,
    paddingEnd: 20,
    getItemKey: (index) => references[index]?.canonical ?? index,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const firstIndex = virtualItems[0]?.index;
  const lastIndex = virtualItems[virtualItems.length - 1]?.index;

  // Scroll-spy: the reference occupying the top of the viewport is "active". The
  // sidebar highlights it, auto-expands its group (via SidebarActiveProvider +
  // keepExpanded), and (below) scrolls to keep it visible. A click just scrolls
  // the Atlas, so it flows through the same spy → one active model for both.
  const scrollOffset = virtualizer.scrollOffset ?? 0;
  const spyIndex = useMemo(() => {
    const vi = virtualItems.find((v) => v.start + v.size > scrollOffset + 80);
    return vi?.index ?? firstIndex ?? 0;
  }, [virtualItems, scrollOffset, firstIndex]);
  // A pin (restore / sidebar click) wins over the scroll position: the target
  // may not reach the viewport top (a short section, or the very last endpoint
  // where the scroll clamps), which would otherwise make the +80 spy report a
  // NEIGHBOR — highlighting the wrong sidebar item and rewriting the hash.
  const activeSpyIndex = pinnedIndex ?? spyIndex;
  const activeHref = references[activeSpyIndex]
    ? refHref(references[activeSpyIndex])
    : undefined;
  const activeCanonical = references[activeSpyIndex]?.canonical as
    | string
    | undefined;

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Reflect the scrolled-to endpoint in the URL as a `#<canonical>` hash so a
  // refresh (or a shared link) lands on that exact operation. Gated: don't start
  // writing the hash until the initial restore below has run, otherwise the
  // top-of-list spy on first paint would clobber the requested endpoint.
  const hashSyncReady = useRef(false);

  // On mount: if the URL points at an endpoint (…/<version>#<canonical>), scroll
  // the Atlas to it, then enable hash sync. Row heights start as estimates, so a
  // single scrollToIndex only lands *near* a far endpoint — re-scroll a couple
  // times as measurements settle before enabling sync.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only restore.
  useEffect(() => {
    const enable = () => {
      hashSyncReady.current = true;
    };
    let target = "";
    try {
      target = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    } catch {
      // A malformed fragment (bad %-escape) — treat as no target, don't throw.
      target = "";
    }
    if (!target) {
      enable();
      return;
    }
    const index = references.findIndex((r) => r.canonical === target);
    if (index < 0) {
      enable();
      return;
    }
    // Pin the restored endpoint so the sidebar highlight + hash name exactly it,
    // even when it can't reach the viewport top (short / last section).
    setPinnedIndex(index);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const raf = requestAnimationFrame(() => {
      virtualizer.scrollToIndex(index, { align: "start" });
      for (const delay of [120, 300]) {
        timers.push(
          setTimeout(
            () => virtualizer.scrollToIndex(index, { align: "start" }),
            delay,
          ),
        );
      }
      timers.push(setTimeout(enable, 340));
    });
    return () => {
      cancelAnimationFrame(raf);
      for (const t of timers) clearTimeout(t);
    };
  }, []);

  // Keep the URL hash in sync with the active endpoint — `replaceState` so it
  // never pushes history entries or triggers a navigation/loader run.
  useEffect(() => {
    if (!hashSyncReady.current || !activeCanonical) return;
    const hash = `#${encodeURIComponent(activeCanonical)}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(window.history.state, "", hash);
    }
  }, [activeCanonical]);

  // Release the pin on the first manual scroll, handing the active endpoint back
  // to the scroll-spy. wheel/touchmove are user-only (a programmatic
  // scrollToIndex never fires them), so a restore/click scroll won't self-clear.
  useEffect(() => {
    const host = atlasHostRef.current;
    if (!host) return;
    const release = () => setPinnedIndex(null);
    host.addEventListener("wheel", release, { passive: true });
    host.addEventListener("touchmove", release, { passive: true });
    return () => {
      host.removeEventListener("wheel", release);
      host.removeEventListener("touchmove", release);
    };
  }, []);

  // Pre-warm the highlight cache for a window ABOVE + BELOW the visible range in
  // idle time, so fast scrolling lands on already-highlighted samples (no loader
  // flash). `prewarmReference` is cache-checked, so re-runs are cheap.
  useEffect(() => {
    if (firstIndex == null || lastIndex == null) return;
    const WINDOW = 15;
    const from = Math.max(0, firstIndex - WINDOW);
    const to = Math.min(references.length - 1, lastIndex + WINDOW);
    // A string theme name ("github-dark") — codehike resolves it at runtime; the
    // Theme type is object-only, same laundering as `atlasContext` above.
    const theme = EDITOR_SETTINGS.theme.coder.syntaxHighlight as Loose;

    let cancelled = false;
    const idle = (cb: () => void): void => {
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(cb, { timeout: 400 });
      } else {
        setTimeout(cb, 0);
      }
    };

    (function step(i: number) {
      if (cancelled || i > to) return;
      idle(() => {
        if (cancelled) return;
        prewarmReference(references[i], theme).finally(() => step(i + 1));
      });
    })(from);

    return () => {
      cancelled = true;
    };
  }, [firstIndex, lastIndex, references]);

  // Keep the active sidebar item visible: after it (auto-)expands + highlights,
  // scroll the left sidebar just enough to bring it into view. Double-rAF so the
  // auto-expand re-render has committed before we look for the anchor.
  useEffect(() => {
    if (!activeHref) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = sidebarRef.current?.querySelector(
          `a[href="${activeHref}"]`,
        ) as HTMLElement | null;
        // Center the active item so it stays comfortably in the middle of the
        // sidebar as it follows the Atlas — never drifting down to the edge.
        el?.scrollIntoView({ block: "center" });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [activeHref]);

  const language = props.specText.trimStart().startsWith("{") ? "json" : "yaml";

  // Debounced live re-convert: POST the edited text to the resource route, which
  // runs the same server-only xyd conversion the loader did. Huge specs cost more
  // to re-convert + re-render, so debounce them longer.
  function onChange(value?: string) {
    clearTimeout(debounce.current);
    const text = value ?? "";
    const debounceMs = text.length > 200_000 ? 700 : 400;
    debounce.current = setTimeout(() => {
      fetcher.submit(
        { spec: text },
        { method: "post", action: "/editor-uniform" },
      );
    }, debounceMs);
  }

  // Apply resource-route results. On a parse error keep the last good render and
  // just surface the message (diagnostics chip).
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    const d = fetcher.data;
    if (d.error) {
      setError(d.error);
      return;
    }
    setError(undefined);
    setReferences(d.references);
    setGroups(d.groups);
    // A re-convert rebuilds the reference list — a stale index would pin the
    // wrong endpoint, so drop the pin and let the spy re-derive.
    setPinnedIndex(null);
  }, [fetcher.state, fetcher.data]);

  // The xyd theme's colour tokens are keyed on the color-scheme; with no
  // `data-color-scheme` the theme's no-scheme fallback resolves the base
  // primitives (--white, --dark*, …) to a DARK palette on our light page — the
  // sidebar/Atlas render broken. Pin light while the editor is mounted (exactly
  // what apidocs-demo does), and restore on unmount.
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.getAttribute("data-color-scheme");
    el.setAttribute("data-color-scheme", "light");
    return () => {
      if (prev === null) el.removeAttribute("data-color-scheme");
      else el.setAttribute("data-color-scheme", prev);
    };
  }, []);

  // FwSidebar renders anchors to `${DOCS_PREFIX}/<canonical>`. The whole spec is
  // rendered (virtualized) in the Atlas, so intercept clicks (capture phase) and
  // scroll the virtualizer to the matching operation instead of navigating — no
  // route change, so Monaco edits survive.
  function onSidebarClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    const anchor = (e.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href");
    if (!href?.startsWith(DOCS_PREFIX)) return;
    const index = references.findIndex((r) => refHref(r) === href);
    if (index < 0) return;
    e.preventDefault();
    e.stopPropagation();
    // The target section may be virtualized (unmounted), so scroll via the
    // virtualizer, not a DOM query.
    virtualizer.scrollToIndex(index, { align: "start" });
    // Pin the clicked endpoint active immediately (don't wait for the spy to
    // catch up, and stay correct for short / last sections).
    setPinnedIndex(index);
  }

  return (
    <div className="flex h-screen flex-col bg-surface-1">
      <EditorTopBar
        api={props.api}
        apis={props.apis}
        version={props.version}
        error={error}
        onSwitchApi={(id) => navigate(`/editor/${id}`)}
        onSwitchVersion={(v) => navigate(`/editor/${props.api.id}/${v}`)}
      />
      <div className="flex min-h-0 flex-1">
        {/* Left: the real xyd sidebar (Framework runtime + opener theme). The
            capture-phase handler intercepts sidebar link clicks — see above. */}
        {/* Zero the header offsets the docs sidebar reserves (we have no xyd
            navbar/subnav) so it doesn't start with a ~100px gap. */}
        <div
          ref={sidebarRef}
          className="atc-editor-sidebar w-[264px] shrink-0 overflow-y-auto border-r border-line"
          style={
            { "--xyd-nav-height": "0px", "--xyd-subnav-height": "0px" } as Loose
          }
          onClickCapture={onSidebarClickCapture}
        >
          <FrameworkC
            settings={EDITOR_SETTINGS}
            sidebarGroups={groups}
            metadata={{
              layout: "wide",
              uniform: "1",
              title: props.api.name,
            }}
            surfaces={surfaces}
            components={{ Search: null }}
          >
            {/* Sync the sidebar's active item to the scrolled-to reference. */}
            <SidebarActiveProvider activeHref={activeHref}>
              <FwSidebar />
            </SidebarActiveProvider>
          </FrameworkC>
        </div>

        {/* Middle + right: resizable Monaco | Atlas split. */}
        <PanelGroup direction="horizontal" className="min-w-0 flex-1">
          <Panel defaultSize={40} minSize={25}>
            <Editor
              height="100%"
              language={language}
              defaultValue={props.specText}
              onChange={onChange}
              beforeMount={(monaco) => {
                // Kill whole-document JSON validation — the built-in JSON worker
                // re-validates the ENTIRE spec on every change, the main Monaco
                // cost for big JSON specs. (YAML has no built-in worker here.)
                monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                  validate: false,
                  enableSchemaRequest: false,
                });
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 12.5,
                // Whole-doc wrap reflow is expensive on 1MB+ specs.
                wordWrap: props.specText.length > 200_000 ? "off" : "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                padding: { top: 12 },
                // Turn off whole-document passes that don't earn their cost on a
                // huge spec (Monaco already virtualizes the visible-line view).
                folding: false,
                bracketPairColorization: { enabled: false },
                occurrencesHighlight: "off",
                stickyScroll: { enabled: false },
                guides: { indentation: false },
                renderWhitespace: "none",
                matchBrackets: "never",
              }}
            />
          </Panel>
          <PanelResizeHandle className="w-px bg-line-soft transition-colors hover:bg-line" />
          <Panel defaultSize={60} minSize={25}>
            <div
              ref={atlasHostRef}
              className="apitoolchain-atlas-host h-full overflow-y-auto bg-white text-ink"
            >
              {references.length ? (
                <AtlasContext.Provider value={atlasContext}>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: virtualizer.getTotalSize(),
                    }}
                  >
                    {virtualItems.map((vi) => (
                      <div
                        key={vi.key}
                        data-index={vi.index}
                        ref={virtualizer.measureElement}
                        className="px-6"
                        style={{
                          // Position by `top`, NOT `transform`: a transformed
                          // ancestor becomes the containing block for
                          // `position: sticky`, breaking the Atlas code samples'
                          // stickiness (only the first row, at ~translateY(0),
                          // would appear to work).
                          position: "absolute",
                          top: vi.start,
                          left: 0,
                          width: "100%",
                        }}
                      >
                        <AtlasRow reference={references[vi.index]} />
                      </div>
                    ))}
                  </div>
                </AtlasContext.Provider>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-subtle">
                  {error
                    ? "Fix the spec to preview the docs."
                    : "No operations in this spec yet."}
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

/** One virtualized reference section (a single API operation). Memoized on the
 * reference object so scrolling and unrelated re-renders (fetcher state churn)
 * never re-highlight an already-mounted row — codehike only re-runs when this
 * reference actually changes. A per-row <Atlas> is cheap: virtualization keeps
 * only ~5–8 rows mounted at a time. Reads the shared <AtlasContext.Provider>
 * wrapping the list (syntaxHighlight / variantToggles / codeSample). */
const AtlasRow = memo(
  function AtlasRow({ reference }: { reference: Loose }) {
    // `analytics` MUST stay on — it mounts Atlas's NOOP tracker; with it off the
    // bundled CodeSample calls useTrackEvent and hard-crashes.
    return <Atlas kind="primary" references={[reference]} analytics />;
  },
  (a, b) => a.reference === b.reference,
);

// A plain <div>, NOT <header>: the xyd theme (loaded on this route) styles bare
// `header` elements like its docs navbar (translucent/blurred), which bled a
// "cloudy" effect onto our top bar.
function EditorTopBar({
  api,
  apis,
  version,
  error,
  onSwitchApi,
  onSwitchVersion,
}: {
  api: RegistryEntry;
  apis: RegistryEntry[];
  version: string;
  error?: string;
  onSwitchApi: (apiId: string) => void;
  onSwitchVersion: (version: string) => void;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-surface px-3">
      <Button variant="ghost" size="sm" href={`/registry/${api.id}`}>
        ← Back
      </Button>
      {error && (
        <span title={error}>
          <Badge tone="error">Invalid spec</Badge>
        </span>
      )}
      <div className="ml-auto flex items-center gap-2">
        {/* API switcher — jump between the editors of every registered spec. */}
        <Menu
          variant="select"
          icon="registry"
          label={api.name}
          align="right"
          items={apis.map((a) => ({
            key: a.id,
            label: a.name,
            active: a.id === api.id,
            onSelect: () => onSwitchApi(a.id),
          }))}
        />
        <Menu
          variant="select"
          icon="tags-outline"
          label={version || "version"}
          align="right"
          items={api.versions.map((v) => ({
            key: v.version,
            label: `${v.version}${v.current ? " · current" : ""}`,
            active: v.version === version,
            onSelect: () => onSwitchVersion(v.version),
          }))}
        />
      </div>
    </div>
  );
}
