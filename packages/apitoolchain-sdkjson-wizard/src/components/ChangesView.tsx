import { Icon } from "@apitoolchain/design-system";
import { useState } from "react";
import type { DiffResult, FileChange, LineType } from "../diff";
import { FileIcon } from "./FileIcon";

/** Renders the prev→next diff of the generated SDK — the "what did my option
 * change do" surface (esp. for behavior options that only touch deep files).
 * Each changed file is collapsible; with many changes they start collapsed so
 * you see the list without scrolling and expand the ones you care about. */
export function ChangesView({ diff }: { diff: DiffResult }) {
  if (!diff.changes.length) {
    return (
      <div className="rounded-control border border-line border-dashed bg-surface px-4 py-8 text-center text-[13px] text-subtle">
        Toggle an option on the left — the exact lines it changes in the
        generated SDK show up here.
      </div>
    );
  }
  const expandAll = diff.changes.length <= 3;
  return (
    <div className="flex flex-col gap-2">
      {diff.changes.map((c) => (
        <FileDiff key={c.path} change={c} defaultOpen={expandAll} />
      ))}
    </div>
  );
}

const CAP = 140;

function FileDiff({
  change,
  defaultOpen,
}: {
  change: FileChange;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const title = change.label ?? change.path;
  const rows: { id: number; type: LineType | "sep"; text: string }[] = [];
  let id = 0;
  change.hunks.forEach((h, hi) => {
    if (hi > 0) rows.push({ id: id++, type: "sep", text: "" });
    for (const l of h.lines)
      rows.push({ id: id++, type: l.type, text: l.text });
  });
  const shown = rows.slice(0, CAP);
  const more = rows.length - shown.length;

  return (
    <div className="overflow-hidden rounded-control border border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 bg-surface px-3 py-1.5 text-left hover:bg-surface-muted"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Icon
            icon={open ? "chevronDown" : "chevronRight"}
            size={12}
            className="shrink-0 text-muted"
          />
          {/* language / file-type icon (Go, TS, …) so the row reads as its lang */}
          {!change.synthetic && <FileIcon path={change.path} />}
          <span className="truncate font-mono text-[12px] text-ink">
            {title}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-[11px]">
          {change.status !== "modified" && (
            <span
              className={
                change.status === "added" ? "text-success" : "text-danger"
              }
            >
              {change.status}
            </span>
          )}
          {change.adds > 0 && (
            <span className="text-success">+{change.adds}</span>
          )}
          {change.dels > 0 && (
            <span className="text-danger">−{change.dels}</span>
          )}
        </span>
      </button>
      {open && (
        <div className="overflow-x-auto border-line border-t bg-surface-muted font-mono text-[12px] leading-relaxed">
          {shown.map((r) =>
            r.type === "sep" ? (
              <div
                key={r.id}
                className="select-none px-3 py-0.5 text-center text-muted"
              >
                ⋯
              </div>
            ) : (
              <DiffRow key={r.id} type={r.type} text={r.text} />
            ),
          )}
          {more > 0 && (
            <div className="px-3 py-1 text-[11px] text-subtle">
              … {more} more {more === 1 ? "line" : "lines"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DiffRow({ type, text }: { type: LineType; text: string }) {
  const tint =
    type === "add"
      ? "bg-success-bg text-body"
      : type === "del"
        ? "bg-danger-bg text-muted"
        : "text-subtle";
  const gutter = type === "add" ? "+" : type === "del" ? "−" : " ";
  return (
    <div className={`flex ${tint}`}>
      <span className="w-5 shrink-0 select-none px-2 text-center text-[11px] opacity-60">
        {gutter}
      </span>
      <pre className="m-0 flex-1 whitespace-pre py-0.5 pr-3">{text || " "}</pre>
    </div>
  );
}
