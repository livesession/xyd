// Oracle A normalizer — semantic canonicalization of the MDX-compiled
// function-body string.
//
// WHY: `@mdx-js/mdx` (and, in the future, `crates/xyd_mdx`) emit a JS
// function-body string. Two semantically-identical compilers can differ in
// pure formatting (indentation, comments, line breaks) and in the *names* of
// compiler-internal temporaries (`_jsx`, `_components`, `_createMdxContent`,
// …). This normalizer strips those cosmetic differences so the golden compares
// on *meaning*, not layout.
//
// HOW (three passes):
//   1. Parse the function-body to an ESTree AST (acorn, with
//      `allowReturnOutsideFunction` because MDX emits a top-level `return`).
//   2. alpha-rename the churny compiler temporaries to a canonical, collision-
//      free `$`-prefixed scheme. Known MDX temps get fixed names; any other
//      `_`-prefixed identifier gets a deterministic `$t<N>` in first-seen order.
//      Semantic names (component references like `Callout`, `MDXContent`,
//      `MDXLayout`, `props`, `toc`, `frontmatter`) and every string literal
//      (text nodes such as "\n", highlighted-code JSON) are left untouched.
//   3. Re-serialize with `estree-util-to-js` (`toJs`) — the SAME generator
//      `@mdx-js/mdx` uses internally — producing canonical, comment-free,
//      formatting-stable output.
//
// The result is idempotent: normalize(normalize(x)) === normalize(x).
//
// PORTING TO RUST (crates/xyd_mdx): a Rust MDX compiler reproduces today's
// output, so it naturally emits the same MDX temp-identifier convention. The
// Rust parity test applies this SAME algorithm (parse → rename per the table
// below → canonical print) to its own output before diffing against the
// committed `compiled.normalized.js`. The identifier map is the contract.
import { Parser } from "acorn";
import { walk } from "estree-walker";
import { toJs } from "estree-util-to-js";

// The fixed churn set observed across the entire apps/docs corpus. These are
// the ONLY compiler-internal identifiers `@mdx-js/mdx` emits (no numeric-suffix
// temps appear in practice); the `$t<N>` fallback future-proofs the rename in
// case a more complex page ever produces `_component0`, `_object1`, etc.
export const CANONICAL_IDENTIFIERS = {
  _Fragment: "$Fragment",
  _jsx: "$jsx",
  _jsxs: "$jsxs",
  _jsxDEV: "$jsxDEV",
  _components: "$components",
  _createMdxContent: "$createMdxContent",
  _missingMdxReference: "$missingMdxReference",
  _provideComponents: "$provideComponents",
};

function makeRenamer() {
  const map = new Map(Object.entries(CANONICAL_IDENTIFIERS));
  let counter = 0;
  return (name) => {
    if (map.has(name)) return map.get(name);
    // Only compiler temporaries (leading underscore) are churny; everything
    // else — component refs, `props`, `toc`, `frontmatter`, `arguments` — is
    // semantic and preserved verbatim.
    if (/^_[A-Za-z][A-Za-z0-9]*$/.test(name)) {
      const canonical = `$t${counter++}`;
      map.set(name, canonical);
      return canonical;
    }
    return name;
  };
}

/**
 * Normalize an MDX-compiled function-body string into its canonical form.
 * @param {string} code raw function-body from ContentFS.compileContent
 * @returns {string} AST-normalized, alpha-renamed, canonically-printed JS
 */
export function normalize(code) {
  const ast = Parser.parse(code, {
    ecmaVersion: 2023,
    sourceType: "script",
    allowReturnOutsideFunction: true,
  });

  const rename = makeRenamer();

  walk(ast, {
    enter(node, parent) {
      if (!node || node.type !== "Identifier") return;
      // Do NOT rename a non-computed member property: `obj._jsx` keeps `_jsx`
      // as a literal property name (none occur today, but stay correct).
      if (
        parent &&
        parent.type === "MemberExpression" &&
        parent.property === node &&
        !parent.computed
      ) {
        return;
      }
      // Do NOT rename a non-shorthand object-property key: `{ _jsx: ... }`.
      if (
        parent &&
        parent.type === "Property" &&
        parent.key === node &&
        !parent.computed &&
        !parent.shorthand
      ) {
        return;
      }
      node.name = rename(node.name);
    },
  });

  return toJs(ast).value;
}
