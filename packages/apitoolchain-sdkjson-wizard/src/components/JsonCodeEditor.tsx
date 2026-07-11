import type { EditorView as EditorViewType } from "@codemirror/view";
import { useEffect, useRef } from "react";
import { buildSdkSchema } from "../model/sdkSchema";

// Schema is derived from the form descriptor (`fields.ts`) so completion matches
// exactly what the wizard produces — built once (pure, browser-safe).
const SDK_SCHEMA = buildSdkSchema();

/**
 * An editable JSON field with schema-aware IntelliSense (completion, hover,
 * inline validation) for `sdk.json` — CodeMirror 6 + `codemirror-json-schema`,
 * fed a schema generated from `fields.ts`. All in the browser (no language
 * server / Node).
 *
 * CodeMirror + codemirror-json-schema are imported DYNAMICALLY inside the mount
 * effect so they never enter an SSR module graph: codemirror-json-schema's ESM
 * build uses extensionless relative imports (`./features/completion`) that
 * Node's SSR resolver rejects. The effect only runs in the browser, so the
 * editor stays fully client-side (SSR renders just the empty host div) and any
 * SSR host (apitoolchain-web) works without special externalization.
 */

const THEME_SPEC = {
  "&": { fontSize: "12.5px", backgroundColor: "transparent" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    lineHeight: "1.6",
  },
  ".cm-content": { padding: "8px 0" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "1px solid var(--color-line, #ececec)",
    color: "#9ca3af",
  },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "transparent" },
  ".cm-tooltip": {
    fontSize: "12px",
    border: "1px solid var(--color-line, #ececec)",
    borderRadius: "8px",
  },
  ".cm-tooltip-autocomplete > ul > li": { padding: "2px 6px" },
};

export function JsonCodeEditor({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorViewType | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Seed the doc from the latest value when the async mount lands (an edit may
  // arrive before the dynamic import resolves — the sync effect below no-ops
  // until the view exists, so this avoids a lost update).
  const valueRef = useRef(value);
  valueRef.current = value;

  // Mount the editor once; `value` is synced via the effect below.
  useEffect(() => {
    let destroyed = false;
    void (async () => {
      const [
        {
          autocompletion,
          closeBrackets,
          closeBracketsKeymap,
          completionKeymap,
        },
        { defaultKeymap, history, historyKeymap, indentWithTab },
        {
          bracketMatching,
          defaultHighlightStyle,
          indentOnInput,
          syntaxHighlighting,
        },
        { lintGutter },
        { EditorState },
        { EditorView, keymap, lineNumbers, tooltips },
        { jsonSchema },
      ] = await Promise.all([
        import("@codemirror/autocomplete"),
        import("@codemirror/commands"),
        import("@codemirror/language"),
        import("@codemirror/lint"),
        import("@codemirror/state"),
        import("@codemirror/view"),
        import("codemirror-json-schema"),
      ]);
      if (destroyed || !host.current) return;
      const view0 = new EditorView({
        parent: host.current,
        state: EditorState.create({
          doc: valueRef.current,
          extensions: [
            lineNumbers(),
            history(),
            indentOnInput(),
            bracketMatching(),
            closeBrackets(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            autocompletion(),
            // Render tooltips (autocomplete popup, hover) fixed-positioned so
            // they escape the `overflow` clipping of the editor host + the modal
            // (dialog is overflow-hidden, body overflow-y-auto). The modal
            // centers via flex — no transformed ancestor — so fixed is
            // viewport-relative and stays in the modal's stacking context.
            tooltips({ position: "fixed" }),
            lintGutter(),
            // json() + parse/schema linters + completion + hover, from the schema.
            jsonSchema(
              SDK_SCHEMA as unknown as Parameters<typeof jsonSchema>[0],
            ),
            keymap.of([
              ...closeBracketsKeymap,
              ...defaultKeymap,
              ...historyKeymap,
              ...completionKeymap,
              indentWithTab,
            ]),
            EditorView.lineWrapping,
            EditorView.theme(THEME_SPEC),
            EditorView.updateListener.of((u) => {
              if (u.docChanged) onChangeRef.current(u.state.doc.toString());
            }),
          ],
        }),
      });
      if (destroyed) {
        view0.destroy();
        return;
      }
      view.current = view0;
    })();
    return () => {
      destroyed = true;
      view.current?.destroy();
      view.current = null;
    };
  }, []);

  // External value → editor (controlled), without clobbering an in-progress edit.
  useEffect(() => {
    const v = view.current;
    if (v && value !== v.state.doc.toString()) {
      v.dispatch({
        changes: { from: 0, to: v.state.doc.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={host}
      className={`overflow-auto rounded-control border border-line bg-surface-muted ${
        className ?? "min-h-[320px] h-[calc(100vh-13rem)]"
      }`}
    />
  );
}
