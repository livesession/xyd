// Oracle B render step for the Rust parity gate. Reuses the COMMITTED harness
// (packages/xyd-content/__fixtures__/mdx-parity/_harness/render.mjs) verbatim —
// that module is the oracle contract and has no live-pipeline dependency
// (only react / react-dom + the estree tools).
//
// Usage: node render_one.mjs <abs path to render.mjs> <abs path to compiled fn-body>
// Prints the normalized rendered HTML (renderOracle) to stdout.
import fs from "node:fs";

const [, , renderMjsPath, codePath] = process.argv;
if (!renderMjsPath || !codePath) {
  console.error("usage: render_one.mjs <render.mjs> <code-file>");
  process.exit(2);
}

const { renderOracle } = await import(renderMjsPath);
const code = fs.readFileSync(codePath, "utf8");
process.stdout.write(renderOracle(code));
