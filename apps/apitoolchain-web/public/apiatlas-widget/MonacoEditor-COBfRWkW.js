import { u as i, a as z, b as l, e as k, K as J, c as Q, d as W, f as X, T as b, U as Y, j as F, g as d, h as A } from "./entry-DeW0Mwi0.js";
function Z(e) {
  const f = e.lastIndexOf(".");
  if (f < 0) return "plaintext";
  switch (e.slice(f + 1).toLowerCase()) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "javascript";
    case "json":
      return "json";
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "md":
    case "markdown":
      return "markdown";
    case "yml":
    case "yaml":
      return "yaml";
    case "py":
      return "python";
    case "rs":
      return "rust";
    case "go":
      return "go";
    case "sh":
    case "bash":
      return "shell";
    case "sql":
      return "sql";
    default:
      return "plaintext";
  }
}
function ne({
  path: e,
  kernelRef: f,
  onSave: x,
  revealSignal: p,
  rawVscodeTheme: E,
  monacoTheme: h,
  fetchInitialBytes: R,
  header: K,
  bottomPadding: B = 0,
  editorRef: D,
  applyingRemoteRef: O,
  onReady: w
}) {
  const L = i(null), U = i(
    null
  ), G = i(!1), m = D ?? U, c = O ?? G, [v, C] = z(null), [P, g] = z(null), S = i(x), T = i(e), N = i(w);
  return l(() => {
    S.current = x;
  }, [x]), l(() => {
    T.current = e;
  }, [e]), l(() => {
    N.current = w;
  }, [w]), l(() => {
    const r = L.current;
    if (!r) return;
    const t = k.create(r, {
      automaticLayout: !0,
      fontSize: 13,
      minimap: { enabled: !1 },
      scrollBeyondLastLine: !1,
      tabSize: 2,
      readOnly: !1,
      padding: { bottom: B }
    });
    return m.current = t, N.current?.(t), t.addCommand(J.CtrlCmd | Q.KeyS, () => {
      const s = T.current, a = S.current;
      !s || !a || Promise.resolve(a(s));
    }), () => {
      N.current?.(null), t.dispose(), m.current = null;
    };
  }, []), l(() => {
    if (h) {
      W(A, h);
      return;
    }
    X(A, E ?? null);
  }, [h, E]), l(() => {
    const r = m.current, t = f.current;
    if (!r || !t) return;
    g(null), C(null);
    const s = t.fs.bootVolume, a = t.fs.eventBus, j = b.readFile(s, e), y = j && j.bytes.length > 0 ? V(j.bytes) : "", q = Y.parse(`vkernel://boot/${e}`);
    let o = k.getModel(q);
    o ? o.getValue() !== y && (c.current = !0, o.setValue(y), c.current = !1) : o = k.createModel(
      y,
      Z(e),
      q
    ), r.setModel(o);
    const M = new AbortController();
    y === "" && R && R(e).then((n) => {
      if (!(!n || M.signal.aborted))
        try {
          b.writeFile(s, a, e, n, "boot");
        } catch (u) {
          g(u instanceof Error ? u.message : String(u));
        }
    }).catch((n) => {
      M.signal.aborted || console.warn("[ide0/editor] fallback fetch failed for", e, n);
    });
    const H = o.onDidChangeContent(() => {
      if (!c.current)
        try {
          const n = o?.getValue() ?? "";
          b.writeFile(s, a, e, _(n), "monaco"), g(null);
        } catch (n) {
          g(n instanceof Error ? n.message : String(n));
        }
    }), I = b.subscribeFile(
      a,
      s.id,
      e,
      (n) => {
        if (n.kind === "delete") {
          c.current = !0, o?.setValue(""), c.current = !1;
          return;
        }
        const u = b.readFile(s, e);
        if (!u) return;
        const $ = V(u.bytes);
        o && $ === o.getValue() || (c.current = !0, o?.setValue($), c.current = !1);
      },
      "monaco"
    );
    return () => {
      M.abort(), H.dispose(), I();
    };
  }, [e, f, R]), l(() => {
    if (!p) return;
    const r = m.current;
    if (!r) return;
    const t = Math.max(1, p.line), s = Math.max(1, p.col);
    r.revealLineInCenter(t), r.setPosition({ lineNumber: t, column: s }), r.focus();
  }, [p?.seq]), /* @__PURE__ */ F("div", { className: "flex h-full w-full flex-col", children: [
    K === null ? null : /* @__PURE__ */ F("div", { className: "flex items-center justify-between border-b border-[color:var(--ide0-editor-border,#e5e5e5)] px-3 py-1.5 text-[12px] text-[color:var(--ide0-editor-foregroundMuted,#525252)]", children: [
      /* @__PURE__ */ d("span", { className: "truncate font-mono", children: K ?? e }),
      P && /* @__PURE__ */ d("span", { className: "text-[11px] text-red-600", children: P })
    ] }),
    v && /* @__PURE__ */ F("div", { className: "flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] text-amber-900", children: [
      /* @__PURE__ */ d("span", { className: "flex-1", children: "File changed on disk while you were editing." }),
      /* @__PURE__ */ d(
        "button",
        {
          type: "button",
          onClick: () => {
            const r = m.current;
            if (!r || !v) return;
            const t = r.getModel();
            t && (c.current = !0, t.setValue(V(v)), c.current = !1, C(null));
          },
          className: "rounded-md bg-amber-600 px-2 py-0.5 text-[11px] text-white hover:bg-amber-700",
          children: "Reload"
        }
      ),
      /* @__PURE__ */ d(
        "button",
        {
          type: "button",
          onClick: () => C(null),
          className: "rounded-md border border-amber-300 px-2 py-0.5 text-[11px] hover:bg-amber-100",
          children: "Keep mine"
        }
      )
    ] }),
    /* @__PURE__ */ d("div", { ref: L, className: "min-h-0 flex-1" })
  ] });
}
function _(e) {
  return new TextEncoder().encode(e);
}
function V(e) {
  return new TextDecoder().decode(e);
}
export {
  ne as MonacoEditor
};
