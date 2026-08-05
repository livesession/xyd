// Oracle B — rendered-HTML equivalence.
//
// WHY: Oracle A pins the *compiled JS*. But a future compiler may emit
// cosmetically-different JS that still renders the same DOM. Oracle B executes
// the compiled module (`new Function`, mirroring the real page loader in
// `packages/xyd-plugin-docs/src/pages/page.tsx`) against a FROZEN component-stub
// set and a fixed jsx runtime, then `renderToStaticMarkup` → DOM-normalized
// HTML. This proves rendered equivalence independent of JS formatting.
//
// The stub set is deliberately "identity-ish":
//   - HTML tag components (h1, p, ul, a, table, …) stay as their identity
//     strings, so they render real HTML elements.
//   - `pre`/`code` are stubbed to a clean <pre><code class="language-…"> form
//     that drops the heavy server-highlight blob (that blob is already pinned
//     verbatim in Oracle A; here we only assert code STRUCTURE).
//   - Every xyd/file component the page needs (Callout, Tabs, Steps, Atlas, …,
//     including dotted members like `Steps.Item`) becomes a children-preserving
//     <xyd-stub data-stub="Name"> wrapper. Names are discovered per-page from
//     the compiled code's `_missingMdxReference("Name", …)` guards, so the set
//     is exactly what the page references — nothing hard-coded, nothing missing.
//
// PORTING TO RUST (crates/xyd_mdx): Oracle B stays a JS step even for the Rust
// compiler — the Rust MDX compiler emits a JS function-body, and the parity
// test runs THAT through this same harness (via node) to render + compare.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// jsx runtime — mirrors `createElementWithKeys` in the real page loader
// (packages/xyd-plugin-docs/src/pages/page.tsx): keys are added to array
// children so React doesn't warn. Output is identical to React.createElement.
function createElementWithKeys(type, props) {
  const processChildren = (arr) =>
    arr.map((child, index) => {
      if (React.isValidElement(child) && child.key == null) {
        return React.cloneElement(child, { key: `mdx-${index}` });
      }
      if (Array.isArray(child)) return processChildren(child);
      return child;
    });
  // When there are no children, don't synthesize `children: []` — void/self-
  // closing HTML tags (hr, img, input for task lists) render as identity tags
  // in this harness and React rejects children on them. (In the real app these
  // map to components, so the loader's `[]` is harmless there.)
  if (!props || props.children == null) {
    return React.createElement(type, props);
  }
  let children;
  if (Array.isArray(props.children)) children = processChildren(props.children);
  else if (React.isValidElement(props.children) && props.children.key == null)
    children = React.cloneElement(props.children, { key: "mdx-child" });
  else children = props.children;
  return React.createElement(type, { ...props, children });
}
const jsx = createElementWithKeys;
const RUNTIME = { Fragment: React.Fragment, jsx, jsxs: jsx, jsxDEV: jsx };

// Serialize a component's SHORT scalar props (kind, title, description, …) into
// deterministic, sorted data-* attributes so prop-carrying components (Callout
// `kind`, DirectiveCodeGroup `title`, …) render non-degenerate HTML. Heavy
// props are deliberately dropped so Oracle B stays about STRUCTURE, not the
// server-highlight blob that Oracle A already pins: skip `children`, skip
// non-scalars, skip JSON-blob strings (leading `[`/`{`), skip values > 200 chars.
// This rule is part of the harness contract — the Rust parity test's JS render
// step reuses this module verbatim.
const PROP_CAP = 200;
function scalarPropAttrs(props) {
  const attrs = {};
  if (!props) return attrs;
  for (const key of Object.keys(props).sort()) {
    if (key === "children") continue;
    const v = props[key];
    const t = typeof v;
    if (t === "boolean" || t === "number") {
      attrs[`data-prop-${key}`] = String(v);
    } else if (t === "string") {
      const s = v.trim();
      if (s.length === 0 || s.length > PROP_CAP) continue;
      if (s[0] === "[" || s[0] === "{") continue; // JSON blob (e.g. codeblocks)
      attrs[`data-prop-${key}`] = v;
    }
  }
  return attrs;
}

function makeStub(name) {
  const Stub = (props) =>
    React.createElement(
      "xyd-stub",
      { "data-stub": name, ...scalarPropAttrs(props) },
      props?.children ?? null
    );
  Stub.displayName = name;
  return Stub;
}

// A clean <pre><code class="language-x">…</code></pre> stub, dropping xyd's
// server-highlight props (`highlighted`, `regions`, `attributes`, …).
function CodePre(props) {
  return React.createElement("pre", { "data-stub": "Code" }, props?.children ?? null);
}
function CodeInline(props) {
  const className = typeof props?.className === "string" ? props.className : undefined;
  return React.createElement("code", { className }, props?.children ?? null);
}

/**
 * Discover the capitalized components a compiled page references, straight from
 * the `_missingMdxReference("Name", true)` guards MDX emits. Returns dotted
 * names too (e.g. "Steps.Item").
 * @param {string} code
 * @returns {string[]}
 */
export function requiredComponents(code) {
  const names = new Set();
  for (const m of code.matchAll(/_missingMdxReference\("([^"]+)",/g)) names.add(m[1]);
  return [...names].sort();
}

/**
 * Build the frozen component map for a page: base tag overrides (pre/code) plus
 * one stub per required capitalized component, wiring dotted members onto their
 * parent (Steps.Item -> stubs.Steps.Item).
 */
export function buildStubs(code) {
  const stubs = { pre: CodePre, code: CodeInline };
  const req = requiredComponents(code);
  for (const full of req) {
    const top = full.split(".")[0];
    if (!stubs[top] || typeof stubs[top] !== "function" || !stubs[top].displayName) {
      // Don't clobber pre/code overrides; only create for capitalized comps.
      if (/^[A-Z]/.test(top) && !stubs[top]) stubs[top] = makeStub(top);
    }
  }
  for (const full of req) {
    if (!full.includes(".")) continue;
    const [top, sub] = full.split(".");
    if (!stubs[top]) stubs[top] = makeStub(top);
    stubs[top][sub] = makeStub(full);
  }
  return Object.freeze(stubs);
}

/**
 * Execute a compiled MDX function-body, mirroring the real page loader's
 * `new Function("_$scope", ...contentKeys, "React", "fileComponents", code)`
 * shape. Returns the module object: { default: MDXContent, toc, frontmatter }.
 */
export function execMDX(code, stubs) {
  const contentComponents = { ...stubs };
  const globals = { ...contentComponents, React };
  const fn = new Function("_$scope", ...Object.keys(globals), "fileComponents", code);
  // fileComponents = undefined -> mirrors the ContentOriginal path (file-scoped
  // components render null); the corpus never relies on file-declared comps.
  return fn(RUNTIME, ...Object.values(globals), undefined);
}

// --- HTML normalization (attribute-order-insensitive) -----------------------
// Sort attributes within every start/self-closing tag so a differently-ordered
// (but equivalent) render still matches. Quote-aware scanning handles attribute
// values that contain '>'. Text content and end tags are left verbatim.
export function normalizeHtml(html) {
  let out = "";
  let i = 0;
  const n = html.length;
  while (i < n) {
    const ch = html[i];
    if (ch !== "<") {
      out += ch;
      i++;
      continue;
    }
    const next = html[i + 1];
    // End tag, comment, doctype: copy through to matching '>'.
    if (next === "/" || next === "!" || next === "?") {
      const end = html.indexOf(">", i);
      const stop = end === -1 ? n : end + 1;
      out += html.slice(i, stop);
      i = stop;
      continue;
    }
    if (!/[a-zA-Z]/.test(next || "")) {
      out += ch;
      i++;
      continue;
    }
    // Start tag: scan to '>' respecting quotes.
    let j = i + 1;
    let quote = null;
    while (j < n) {
      const c = html[j];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === ">") {
        break;
      }
      j++;
    }
    const inner = html.slice(i + 1, j); // between '<' and '>'
    out += "<" + normalizeTagInner(inner) + ">";
    i = j + 1;
  }
  return out;
}

function normalizeTagInner(inner) {
  let selfClose = false;
  let body = inner;
  if (body.endsWith("/")) {
    selfClose = true;
    body = body.slice(0, -1);
  }
  const nameMatch = body.match(/^([a-zA-Z][\w:-]*)/);
  if (!nameMatch) return inner;
  const name = nameMatch[1];
  let rest = body.slice(name.length);
  const attrs = [];
  const attrRe = /\s+([^\s=/>]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g;
  let m;
  while ((m = attrRe.exec(rest)) !== null) {
    const key = m[1];
    let val = m[2];
    if (val === undefined) {
      attrs.push({ key, str: key });
    } else {
      // Normalize single quotes to double for stable comparison.
      if (val.startsWith("'") && val.endsWith("'")) {
        val = '"' + val.slice(1, -1).replace(/"/g, "&quot;") + '"';
      } else if (!val.startsWith('"')) {
        val = '"' + val + '"';
      }
      attrs.push({ key, str: `${key}=${val}` });
    }
  }
  attrs.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const attrStr = attrs.map((a) => a.str).join(" ");
  return name + (attrStr ? " " + attrStr : "") + (selfClose ? " /" : "");
}

/**
 * Full Oracle B: compiled function-body string -> normalized rendered HTML.
 * @param {string} code compiled function-body from ContentFS.compileContent
 * @returns {string}
 */
export function renderOracle(code) {
  const stubs = buildStubs(code);
  const mod = execMDX(code, stubs);
  const Comp = mod?.default;
  if (typeof Comp !== "function") {
    throw new Error("compiled module has no default component");
  }
  const html = renderToStaticMarkup(
    React.createElement(Comp, { components: { ...stubs } })
  );
  return normalizeHtml(html);
}
