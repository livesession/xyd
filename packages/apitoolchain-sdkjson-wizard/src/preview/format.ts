import { format as biome } from "@wasm-fmt/biome_fmt";
import { format as clang } from "@wasm-fmt/clang-format";
import { format as gofmt } from "@wasm-fmt/gofmt";
import { format as ruff } from "@wasm-fmt/ruff_fmt";

/**
 * Pretty-prints generated SDK code by its highlight-language id, using the
 * `@wasm-fmt` WASM formatters (ruff for Python, gofmt for Go, biome for TS/JS,
 * clang-format for Java/C#) so a hero usage snippet reads well instead of one
 * long line. NODE-ONLY (the formatters load their WASM synchronously at import;
 * this lives under `preview/`, which never enters the browser barrel).
 *
 * Ruby has no `@wasm-fmt` formatter, so it passes through unchanged. Never
 * throws — a formatter error (or an unformattable partial snippet) returns the
 * input, so a preview is never dropped over cosmetics.
 */

// clang-format styles per language, capped near the preview's column width.
const JAVA_STYLE = "{BasedOnStyle: Google, ColumnLimit: 90}";
const CS_STYLE = "{BasedOnStyle: Microsoft, ColumnLimit: 90}";
const MAX_WIDTH = 88;

export function formatCode(code: string, language: string): string {
  if (!code.trim()) return code;
  try {
    switch (language) {
      case "python":
        return ruff(code);
      case "go":
        return gofmt(code);
      case "typescript":
      case "javascript":
        return biome(code, "snippet.ts");
      case "json":
        return biome(code, "snippet.json");
      case "java":
        return clang(code, "Snippet.java", JAVA_STYLE);
      case "csharp":
        return clang(code, "Snippet.cs", CS_STYLE);
      case "ruby":
        return formatRuby(code);
      default:
        return code;
    }
  } catch {
    return code;
  }
}

/**
 * There's no `@wasm-fmt` Ruby formatter, so wrap over-long generated method
 * calls (`x.y(a: 1, b: 2, …)`) onto one argument per line — matching what
 * ruff/biome/gofmt do for the others. Generated snippets have a regular shape
 * (assignment + a single call), so a top-level argument split is enough.
 */
function formatRuby(code: string): string {
  return code
    .split("\n")
    .map((line) => (line.length > MAX_WIDTH ? wrapRubyCall(line) : line))
    .join("\n");
}

function wrapRubyCall(line: string): string {
  const open = line.indexOf("(");
  const trimmed = line.trimEnd();
  if (open < 0 || !trimmed.endsWith(")")) return line;
  const indent = line.match(/^\s*/)?.[0] ?? "";
  const args = splitTopLevel(line.slice(open + 1, trimmed.length - 1));
  if (args.length < 2) return line;
  const body = args.map((a) => `${indent}  ${a}`).join(",\n");
  return `${line.slice(0, open + 1)}\n${body}\n${indent})`;
}

/** Split by top-level commas, respecting (), [], {}, and string literals. */
function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      out.push(s.slice(start, i));
      start = i + 1;
    }
  }
  out.push(s.slice(start));
  return out.map((a) => a.trim()).filter(Boolean);
}
