import { Badge, Callout, Dropdown, Tabs } from "@apitoolchain/design-system";
import { useEffect, useMemo, useState } from "react";
import { type DiffEntry, diffFiles } from "../diff";
import type {
  PreviewFile,
  PreviewOperation,
  PreviewResult,
  SdkLanguage,
} from "../model/types";
import { LANGUAGE_META } from "../model/types";
import { ChangesView } from "./ChangesView";
import { CodePreview } from "./CodePreview";
import { FileTree } from "./FileTree";

type View = "usage" | "files";

const USAGE_KEY = "‹usage example›";

/** Internal regen manifest (`.sdk/sdk.lock`, path→sha) — never show it in the
 * preview or diff. Guarded here too (not just the backend) so it disappears via
 * HMR without a Storybook restart. */
const isHiddenFile = (path: string) => path.startsWith(".sdk/");

/** Content scroll-height for the page-sticky layout (non-fill) — the tabs stay
 * pinned while the code/diff scrolls inside. The `fill` (modal) layout doesn't
 * use this: it fills its container and scrolls via flex. */
const PANE_H = "max-h-[calc(100vh-11rem)]";

export function PreviewPanel({
  result,
  loading,
  language,
  previousFiles,
  previousUsage,
  previousOperations,
  sticky = true,
  fill = false,
}: {
  result: PreviewResult | null;
  loading: boolean;
  language: SdkLanguage;
  /** the previous generation's files (same language) — for the changes diff. */
  previousFiles: PreviewFile[] | null;
  previousUsage?: string;
  /** the previous generation's per-operation usage (same language) — so switching
   * endpoints diffs THAT operation's own prev→current, not a cross-op diff. */
  previousOperations?: PreviewOperation[] | null;
  /** Cap the content areas at viewport height + scroll them (page-sticky
   * layout). When false the content flows in the host's own scroll. */
  sticky?: boolean;
  /** Contained layout: fill the parent (flex) and scroll the content regions
   * internally — for the fixed-height modal. Takes precedence over `sticky`. */
  fill?: boolean;
}) {
  const [view, setView] = useState<View>("usage");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  // Which operation's usage the switcher shows — kept stable across regens while
  // the op still exists (like the selected file below).
  const [activeOpId, setActiveOpId] = useState<string | null>(null);
  const hl = LANGUAGE_META[language].highlight;
  // fill: fill the container + scroll internally (flex). sticky: cap at viewport
  // height + scroll. flow: natural size (host scrolls).
  const paneH = fill ? "min-h-0" : sticky ? PANE_H : "";
  const scrollBox = fill
    ? "min-h-0 flex-1 overflow-auto"
    : sticky
      ? `overflow-auto ${PANE_H}`
      : "";
  // Memoize on `result.files` identity — a fresh array each render would defeat
  // the `selected` + (heavy) `diff` memos below, re-running the multi-file LCS on
  // unrelated re-renders (tab/file/endpoint clicks, loading toggles).
  const files = useMemo(
    () => (result?.files ?? []).filter((f) => !isHiddenFile(f.path)),
    [result?.files],
  );
  const operations = result?.operations ?? [];

  // keep the selected file across regens when its path still exists.
  useEffect(() => {
    if (!files.length) {
      setSelectedPath(null);
      return;
    }
    setSelectedPath((cur) =>
      cur && files.some((f) => f.path === cur) ? cur : files[0].path,
    );
  }, [files]);

  // keep the selected operation across regens when its id still exists; else fall
  // to the hero (defaultOperationId) or the first op.
  useEffect(() => {
    const ops = result?.operations ?? [];
    if (!ops.length) {
      setActiveOpId(null);
      return;
    }
    setActiveOpId((cur) =>
      cur && ops.some((o) => o.id === cur)
        ? cur
        : (result?.defaultOperationId ?? ops[0].id),
    );
  }, [result?.operations, result?.defaultOperationId]);

  const selected = useMemo(
    () => files.find((f) => f.path === selectedPath) ?? files[0],
    [files, selectedPath],
  );

  // The op the switcher currently shows + its usage. The diff pairs it with the
  // SAME op's previous-generation code so switching endpoints shows that op's own
  // change (falling back to the hero `usage` when the op is new / absent). Before
  // the effect settles `activeOpId`, prefer the hero so the first paint already
  // matches `usage`.
  const activeOp =
    operations.find(
      (o) => o.id === (activeOpId ?? result?.defaultOperationId),
    ) ?? operations[0];
  const activeUsage = activeOp?.code ?? result?.usage;
  const activePreviousUsage =
    previousOperations?.find((o) => o.id === activeOp?.id)?.code ??
    previousUsage;

  // Diff prev→current (same language) — surfaces what the last edit changed,
  // incl. behavior options that only touch deep runtime files. The usage snippet
  // is a synthetic entry so export/naming changes show here too.
  const diff = useMemo(() => {
    if (result?.error)
      return { changes: [], changedPaths: new Set<string>(), adds: 0, dels: 0 };
    const next: DiffEntry[] = [
      {
        path: USAGE_KEY,
        label: "Usage example",
        code: activeUsage ?? "",
        synthetic: true,
      },
      ...files.map((f) => ({ path: f.path, code: f.code })),
    ];
    const prev: DiffEntry[] | null =
      previousFiles == null
        ? null
        : [
            {
              path: USAGE_KEY,
              label: "Usage example",
              code: activePreviousUsage ?? "",
              synthetic: true,
            },
            ...previousFiles
              .filter((f) => !isHiddenFile(f.path))
              .map((f) => ({ path: f.path, code: f.code })),
          ];
    return diffFiles(prev, next);
  }, [files, activeUsage, result?.error, previousFiles, activePreviousUsage]);

  const changedCount = diff.changes.length;
  const viewItems = [
    { key: "usage", label: "Usage & changes" },
    { key: "files", label: "Files", count: files.length || undefined },
  ];

  return (
    <div className={`flex min-h-0 flex-col gap-3 ${fill ? "flex-1" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <Tabs
          items={viewItems}
          activeKey={view}
          onChange={(k) => setView(k as View)}
        />
        {loading && (
          <Badge tone="neutral" dot>
            Generating…
          </Badge>
        )}
      </div>

      {result?.error && (
        <Callout tone="error" title="Generation failed">
          {result.error}
        </Callout>
      )}

      {/* Usage (top) + Changes (bottom, collapsible) share one scroll area so you
          always see the call AND what your last edit changed. */}
      {view === "usage" && (
        <div className={`flex flex-col gap-3 ${scrollBox}`}>
          <section className="flex min-w-0 flex-col gap-1.5">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <SectionLabel>Usage</SectionLabel>
              {/* Endpoint switcher: view the real SDK call for any operation, not
                  just the hero. Only shown when there's more than one. */}
              {operations.length > 1 && activeOp && (
                <Dropdown
                  variant="select"
                  icon="bolt"
                  align="right"
                  // A large API can have many operations — cap + scroll so the
                  // menu never runs off-screen.
                  maxHeight="min(360px, 50vh)"
                  label={`${activeOp.httpMethod} ${activeOp.path}`}
                  items={operations.map((o) => ({
                    key: o.id,
                    label: `${o.httpMethod} ${o.path}`,
                    active: o.id === activeOp.id,
                    onSelect: () => setActiveOpId(o.id),
                  }))}
                />
              )}
            </div>
            {activeUsage ? (
              // Cap the usage block so a long snippet scrolls internally instead
              // of pushing the Changes section below the fold.
              <CodePreview
                code={activeUsage}
                language={hl}
                className="max-h-[40vh]"
              />
            ) : (
              <Empty>No usage snippet for this operation.</Empty>
            )}
          </section>
          <section className="flex min-w-0 flex-col gap-1.5">
            <SectionLabel>
              Changes
              {changedCount > 0 && (
                <span className="ml-1 font-normal text-subtle normal-case">
                  · {changedCount} {changedCount === 1 ? "item" : "items"}
                </span>
              )}
            </SectionLabel>
            <ChangesView diff={diff} />
          </section>
        </div>
      )}

      {view === "files" &&
        (files.length ? (
          <div
            className={`grid min-h-0 grid-cols-[minmax(160px,220px)_1fr] gap-3 ${
              fill ? "flex-1" : ""
            }`}
          >
            <FileTree
              files={files}
              selectedPath={selected?.path}
              onSelect={setSelectedPath}
              changedPaths={diff.changedPaths}
              maxHeightClass={paneH}
            />
            {selected && (
              <CodePreview
                code={selected.code}
                language={selected.language}
                className={paneH}
              />
            )}
          </div>
        ) : (
          <Empty>No files — configure the options on the left.</Empty>
        ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
      {children}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-control border border-line border-dashed bg-surface px-4 py-8 text-center text-[13px] text-subtle">
      {children}
    </div>
  );
}
