// JS-OWNED golden generator — the parity oracle for `xyd_highlight`.
//
// Runs the REAL `@syntax0/highlight` engine (the one xyd ships today) over a
// corpus of representative snippets for the top-20 docs languages + two
// cross-grammar embed cases, across github-dark + dark-plus, and writes the
// `.lines` output to `tests/goldens/<case>.json`. The Rust snapshot-parity test
// (`tests/snapshot_parity.rs`) loads these committed goldens and asserts
// `Registry::highlight_lang(...)` byte-matches them. RUST NEVER WRITES GOLDENS —
// this script is the only writer, and only when explicitly regenerating.
//
//   HL_BUILD_FIXTURES=1 bun scripts/gen-goldens.mjs
//
// Overrides: CODE9_DIR (root of the code9 checkout).

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const CODE9_DIR =
  process.env.CODE9_DIR ||
  "/Users/zdunecki/Code/livesession/codable/third-party/code9";
const ENGINE = join(CODE9_DIR, "packages/syntax0-highlight/dist/index.js");

const CRATE = new URL("..", import.meta.url).pathname;
const OUT = join(CRATE, "tests/goldens");

const THEMES = ["github-dark", "dark-plus"];

// The corpus: representative snippets exercising keywords, strings, numbers,
// comments, and structure for each of the top-20 docs languages, plus two
// cross-grammar embed cases. `lang` is the alias passed to the engine.
const CORPUS = [
  { name: "js", lang: "js", code: 'const x = 1;\nfunction greet(name) {\n  return `Hi ${name}`;\n}\n// done' },
  { name: "ts", lang: "ts", code: 'interface User { id: number; name: string }\nconst u: User = { id: 1, name: "a" };' },
  { name: "tsx", lang: "tsx", code: 'const App = () => <div className="x">{count}</div>;' },
  { name: "jsx", lang: "jsx", code: 'const el = <Button onClick={fn}>Go</Button>;' },
  { name: "json", lang: "json", code: '{ "a": 1, "b": [true, null, "s"] }' },
  { name: "bash", lang: "bash", code: '#!/bin/bash\nexport FOO=bar\necho "$FOO" | grep x' },
  { name: "html", lang: "html", code: '<!DOCTYPE html>\n<div class="a" id="b">Hi <b>there</b></div>' },
  { name: "css", lang: "css", code: '.foo {\n  color: #fff;\n  margin: 0 auto;\n}\n/* c */' },
  { name: "yaml", lang: "yaml", code: 'name: test\nlist:\n  - a\n  - b\nnum: 42' },
  { name: "python", lang: "python", code: 'def greet(name):\n    return f"Hello {name}"\n# comment' },
  { name: "go", lang: "go", code: 'package main\n\nfunc main() {\n\tx := 1\n\tfmt.Println(x)\n}' },
  { name: "rust", lang: "rust", code: 'fn main() {\n    let x: i32 = 1;\n    println!("{}", x);\n}' },
  { name: "graphql", lang: "graphql", code: 'query Foo {\n  user(id: 1) {\n    name\n  }\n}' },
  { name: "markdown", lang: "markdown", code: '# Title\n\nSome **bold** and *italic*.\n\n- item' },
  { name: "diff", lang: "diff", code: '--- a\n+++ b\n@@ -1 +1 @@\n-old\n+new' },
  { name: "sql", lang: "sql", code: 'SELECT id, name FROM users WHERE id = 1;' },
  { name: "java", lang: "java", code: 'class A {\n  public static void main(String[] a) {\n    int x = 1;\n  }\n}' },
  { name: "c", lang: "c", code: '#include <stdio.h>\nint main() {\n  return 0;\n}' },
  { name: "cpp", lang: "cpp", code: '#include <iostream>\nint main() {\n  std::cout << 1;\n}' },
  { name: "toml", lang: "toml", code: '[section]\nkey = "value"\nnum = 42' },
  // Cross-grammar embed cases:
  { name: "embed_md_js", lang: "markdown", code: '# Doc\n\n```js\nconst x = 1;\n```\n' },
  { name: "embed_html_script_style", lang: "html", code: '<style>.a { color: red; }</style>\n<script>const x = 1;</script>' },
  // Injection case: bare `<` / `&` in html body text fire html's own
  // `R:text.html - (...)` invalid-character injections.
  { name: "html_injection", lang: "html", code: '<p>1 < 2 &amp; a & b</p>' },
];

async function main() {
  if (!process.env.HL_BUILD_FIXTURES) {
    console.error(
      "refusing to write goldens: set HL_BUILD_FIXTURES=1 to regenerate the oracle",
    );
    process.exit(2);
  }
  const { highlight } = await import(ENGINE);
  mkdirSync(OUT, { recursive: true });

  for (const c of CORPUS) {
    const themes = {};
    for (const t of THEMES) {
      const r = await highlight(c.code, c.lang, t);
      themes[t] = r.lines;
    }
    const golden = { lang: c.lang, code: c.code, themes };
    writeFileSync(join(OUT, `${c.name}.json`), JSON.stringify(golden, null, 0) + "\n");
    console.log(`wrote ${c.name}.json (${c.lang})`);
  }
  console.log(`\n${CORPUS.length} goldens x ${THEMES.length} themes -> ${OUT}`);
}

await main();
