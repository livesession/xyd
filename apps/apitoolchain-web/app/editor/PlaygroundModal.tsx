import { Modal } from "@apitoolchain/design-system";
import { useEffect, useRef } from "react";
import { specTextToDocument } from "~/lib/openapi/specToReferences";

// The apiatlas playground widget — a self-contained ES-module dist copied into
// public/apiatlas-widget/ (built by apiatlas, synced by scripts/sync-apiatlas-
// widget.sh — no source vendored). It's dynamic-imported the first time the modal
// opens, mounts its own React root into a host <div>, and runs requests through
// the /apiatlas-api proxy (the vite plugin in vite.config.ts). The widget owns its
// own header chrome (worktree toggle · search · close), so the modal is chromeless
// and just hands it an `onClose`.
const WIDGET_JS = "/apiatlas-widget/widget.js";
const WIDGET_CSS = "/apiatlas-widget/widget.css";

interface WidgetApi {
  mount: (
    el: HTMLElement,
    props: {
      operation: { reference: unknown; doc: unknown };
      // biome-ignore lint/suspicious/noExplicitAny: uniform References, passed opaquely
      references?: any[];
      proxyBaseUrl?: string;
      onClose?: () => void;
    },
  ) => void;
  unmount: (el: HTMLElement) => void;
  /** Open another operation as a tab in an already-mounted widget (state persists). */
  openOperation: (
    el: HTMLElement,
    operation: { reference: unknown; doc: unknown },
  ) => void;
}

declare global {
  interface Window {
    ApiatlasPlayground?: WidgetApi;
  }
}

let widgetPromise: Promise<WidgetApi> | null = null;
function loadWidget(): Promise<WidgetApi> {
  if (!widgetPromise) {
    if (
      typeof document !== "undefined" &&
      !document.querySelector(`link[href="${WIDGET_CSS}"]`)
    ) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = WIDGET_CSS;
      document.head.appendChild(link);
    }
    // The widget is a public asset — Vite forbids `import()`-ing /public from
    // source, so load it as a <script type="module"> (the allowed way to
    // reference public assets) and read the global its entry sets on eval.
    widgetPromise = new Promise<WidgetApi>((resolve, reject) => {
      if (window.ApiatlasPlayground) return resolve(window.ApiatlasPlayground);
      const script = document.createElement("script");
      script.type = "module";
      script.src = WIDGET_JS;
      script.onload = () => {
        if (window.ApiatlasPlayground) resolve(window.ApiatlasPlayground);
        else
          reject(
            new Error(
              "apiatlas widget loaded but exposed no ApiatlasPlayground global",
            ),
          );
      };
      script.onerror = () =>
        reject(new Error(`failed to load apiatlas widget from ${WIDGET_JS}`));
      document.head.appendChild(script);
    });
  }
  return widgetPromise;
}

export interface PlaygroundModalProps {
  /** The clicked operation's uniform Reference, or null when closed. */
  // biome-ignore lint/suspicious/noExplicitAny: uniform Reference, passed opaquely to the widget
  reference: any | null;
  /** Every operation in the spec — feeds the worktree endpoint list. */
  // biome-ignore lint/suspicious/noExplicitAny: uniform References, passed opaquely
  references: any[];
  /** The full OpenAPI spec text (the widget derives servers/auth/body from it). */
  specText: string;
  open: boolean;
  onClose: () => void;
}

export function PlaygroundModal({
  reference,
  references,
  specText,
  open,
  onClose,
}: PlaygroundModalProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<WidgetApi | null>(null);
  const mountedRef = useRef(false);
  // Latest values readable inside the async mount without re-triggering it.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const referencesRef = useRef(references);
  referencesRef.current = references;

  // The widget mounts ONCE and stays alive (the Modal is `keepMounted`, so the
  // host div survives close→reopen). Reopening for a different operation opens it
  // as a tab — tabs / edits / responses persist instead of a state-wiping remount.
  useEffect(() => {
    if (!open || !reference || !hostRef.current) return;
    let cancelled = false;
    (async () => {
      // The widget needs a dereferenced doc (for body-schema + auth) alongside the
      // reference; the app already parses spec text client-side for the editor.
      const doc = await specTextToDocument(specText);
      const w = await loadWidget();
      if (cancelled || !hostRef.current) return;
      apiRef.current = w;
      const el = hostRef.current;
      if (!mountedRef.current) {
        w.mount(el, {
          operation: { reference, doc },
          references: referencesRef.current,
          proxyBaseUrl: "/apiatlas-api",
          onClose: () => onCloseRef.current(),
        });
        mountedRef.current = true;
      } else {
        w.openOperation(el, { reference, doc });
      }
      // Un-hiding can leave inner editors (Monaco) unlaid-out — nudge a relayout.
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    })();
    return () => {
      cancelled = true;
    };
  }, [open, reference, specText]);

  // Tear the widget down only when THIS component unmounts — not on close.
  useEffect(() => {
    return () => {
      if (apiRef.current && hostRef.current)
        apiRef.current.unmount(hostRef.current);
    };
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Run request"
      size="xl"
      fill
      chromeless
      keepMounted
    >
      {/* Full-bleed: the widget fills the dialog on all four sides (0 gap) and owns
          its own header chrome (toggle · search · close) — no modal chrome. */}
      <div
        ref={hostRef}
        className="apiatlas-playground"
        style={{ height: "100%", width: "100%" }}
      />
    </Modal>
  );
}
