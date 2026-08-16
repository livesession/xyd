// JS-OWNED golden generator — the H3 parity oracle for `xyd_highlight`.
//
// Runs the REAL `codehike/code` `highlight()` (the actual function the xyd call
// sites consume) over the H2 language corpus + a few `meta`/edge cases, across
// github-dark + dark-plus, and writes the FULL `HighlightedCode` object to
// `tests/goldens-codehike/<case>.json`. The Rust H3 test
// (`tests/highlighted_parity.rs`) loads these committed goldens and asserts
// `highlighted_code(value, lang, meta, theme)` byte-matches them.
//
// RUST NEVER WRITES GOLDENS — this script is the only writer, and only when
// explicitly regenerating:
//
//   HL_BUILD_FIXTURES=1 node scripts/gen-codehike-goldens.mjs
//   HL_BUILD_FIXTURES=1 bun  scripts/gen-codehike-goldens.mjs
//
// `codehike/code` is resolved from a package that declares it as a dependency
// (default: packages/xyd-content) via createRequire, so the script works from
// any cwd and under both node + bun. Override the resolving package with
// CODEHIKE_BASE=/abs/path/to/pkg (must contain node_modules/codehike).

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const CRATE = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(CRATE, "tests/goldens-codehike");
const BASE = process.env.CODEHIKE_BASE || join(CRATE, "../../packages/xyd-content");

const THEMES = ["github-dark", "dark-plus"];

// The corpus: the H2 language snippets (identical code) — the strongest parity
// proof is maximal overlap with the H1/H2 goldens — plus a handful of `meta`
// strings and edge cases (unknown language → txt fallback, plain txt).
// `alias` is the language alias passed to `highlight`; `meta` is the RawCode
// meta string (empty for most).
const CORPUS = [
  { name: "js", alias: "js", value: 'const x = 1;\nfunction greet(name) {\n  return `Hi ${name}`;\n}\n// done' },
  { name: "ts", alias: "ts", value: 'interface User { id: number; name: string }\nconst u: User = { id: 1, name: "a" };' },
  { name: "tsx", alias: "tsx", value: 'const App = () => <div className="x">{count}</div>;' },
  { name: "jsx", alias: "jsx", value: 'const el = <Button onClick={fn}>Go</Button>;' },
  { name: "json", alias: "json", value: '{ "a": 1, "b": [true, null, "s"] }' },
  { name: "bash", alias: "bash", value: '#!/bin/bash\nexport FOO=bar\necho "$FOO" | grep x' },
  { name: "html", alias: "html", value: '<!DOCTYPE html>\n<div class="a" id="b">Hi <b>there</b></div>' },
  { name: "css", alias: "css", value: '.foo {\n  color: #fff;\n  margin: 0 auto;\n}\n/* c */' },
  { name: "yaml", alias: "yaml", value: 'name: test\nlist:\n  - a\n  - b\nnum: 42' },
  { name: "python", alias: "python", value: 'def greet(name):\n    return f"Hello {name}"\n# comment' },
  { name: "go", alias: "go", value: 'package main\n\nfunc main() {\n\tx := 1\n\tfmt.Println(x)\n}' },
  { name: "rust", alias: "rust", value: 'fn main() {\n    let x: i32 = 1;\n    println!("{}", x);\n}' },
  { name: "graphql", alias: "graphql", value: 'query Foo {\n  user(id: 1) {\n    name\n  }\n}' },
  { name: "markdown", alias: "markdown", value: '# Title\n\nSome **bold** and *italic*.\n\n- item' },
  { name: "diff", alias: "diff", value: '--- a\n+++ b\n@@ -1 +1 @@\n-old\n+new' },
  { name: "sql", alias: "sql", value: 'SELECT id, name FROM users WHERE id = 1;' },
  { name: "java", alias: "java", value: 'class A {\n  public static void main(String[] a) {\n    int x = 1;\n  }\n}' },
  { name: "c", alias: "c", value: '#include <stdio.h>\nint main() {\n  return 0;\n}' },
  { name: "cpp", alias: "cpp", value: '#include <iostream>\nint main() {\n  std::cout << 1;\n}' },
  { name: "toml", alias: "toml", value: '[section]\nkey = "value"\nnum = 42' },
  // Cross-grammar embed cases:
  { name: "embed_md_js", alias: "markdown", value: '# Doc\n\n```js\nconst x = 1;\n```\n' },
  { name: "embed_html_script_style", alias: "html", value: '<style>.a { color: red; }</style>\n<script>const x = 1;</script>' },
  { name: "html_injection", alias: "html", value: '<p>1 < 2 &amp; a & b</p>' },
  // `meta` strings: codehike passes them through unchanged (no `!` annotations).
  { name: "meta_js", alias: "js", value: 'const x = 1;\nconst y = 2;', meta: 'title="example.js" showLineNumbers' },
  { name: "meta_python", alias: "python", value: 'def f():\n    return 1', meta: 'focus[2]' },
  // Edge cases: unknown language falls back to txt; plain txt keeps default color.
  { name: "unknown_lang", alias: "totally-not-a-lang", value: 'plain text line\nsecond line' },
  { name: "txt", alias: "txt", value: 'plain text line\nsecond line' },
];

async function main() {
  if (!process.env.HL_BUILD_FIXTURES) {
    console.error(
      "refusing to write goldens: set HL_BUILD_FIXTURES=1 to regenerate the codehike oracle",
    );
    process.exit(2);
  }

  const require = createRequire(join(BASE, "package.json"));
  let codehikePath;
  try {
    codehikePath = require.resolve("codehike/code");
  } catch (e) {
    console.error(
      `cannot resolve "codehike/code" from ${BASE}\n` +
        `set CODEHIKE_BASE to a package that has codehike installed ` +
        `(e.g. packages/xyd-content or packages/xyd-plugin-docs)\n${e.message}`,
    );
    process.exit(2);
  }
  const { highlight } = await import(pathToFileURL(codehikePath).href);

  mkdirSync(OUT, { recursive: true });

  for (const c of CORPUS) {
    const meta = c.meta ?? "";
    const themes = {};
    for (const t of THEMES) {
      // The exact call the xyd sites make: highlight(RawCode, themeName).
      themes[t] = await highlight({ value: c.value, lang: c.alias, meta }, t);
    }
    const golden = { name: c.name, value: c.value, alias: c.alias, meta, themes };
    writeFileSync(join(OUT, `${c.name}.json`), JSON.stringify(golden, null, 0) + "\n");
    console.log(`wrote ${c.name}.json (alias=${c.alias})`);
  }
  console.log(`\n${CORPUS.length} goldens x ${THEMES.length} themes -> ${OUT}`);
}

await main();
