/**
 * Generate `src/tokens/design-tokens.json` from the Tailwind v4 `@theme {}` block
 * in `src/styles/theme.css`. Run with `bun run gen:tokens`. The Design tokens
 * story imports the result (generate-then-import), so the JSON is a real,
 * committed artifact rather than computed at render time.
 *
 * Colors are validated + normalized through @projectwallace/css-design-tokens.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  css_to_tokens,
  EXTENSION_AUTHORED_AS,
  EXTENSION_CSS_PROPERTIES,
} from "@projectwallace/css-design-tokens";

const root = resolve(import.meta.dir, "..");
const themeCss = readFileSync(resolve(root, "src/styles/theme.css"), "utf8");

type Token = { name: string; label: string; value: string };

/** Pull `--name: value;` declarations out of the `@theme { }` block. */
function parseTheme(css: string): Token[] {
  const block = css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  const out: Token[] = [];
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec loop
  while ((m = re.exec(block)) !== null) {
    out.push({
      name: m[1],
      label: m[1].replace(/^--/, ""),
      value: m[2].replace(/\s+/g, " ").trim(),
    });
  }
  return out;
}

const tokens = parseTheme(themeCss);
const raw = Object.fromEntries(tokens.map((t) => [t.name, t.value]));
const group = (prefix: string) =>
  tokens
    .filter((t) => t.name.startsWith(prefix))
    .map((t) => ({
      ...t,
      label: t.label.slice(prefix.replace(/^--/, "").length),
    }));

// Internal helper vars (`--cds-*`) back a public token; hide from the palette.
const colors = group("--color-").filter((t) => !t.name.startsWith("--cds-"));
const radii = group("--radius-");
const shadows = group("--shadow-");
const fonts = group("--font-");
const textTokens = group("--text-");
const typeScale = textTokens
  .filter((t) => !t.label.includes("--line-height"))
  .sort((a, b) => Number.parseFloat(b.value) - Number.parseFloat(a.value)); // biggest → smallest

// Colors validated by the lib, keyed by their `--color-*` name (via extensions).
const validated: Record<string, string> = {};
try {
  const rootCss = `:root {\n${colors.map((t) => `${t.name}: ${t.value};`).join("\n")}\n}`;
  for (const tok of Object.values(css_to_tokens(rootCss).color)) {
    const prop = tok.$extensions[EXTENSION_CSS_PROPERTIES]?.[0];
    if (prop?.startsWith("--color-")) {
      validated[prop] = tok.$extensions[EXTENSION_AUTHORED_AS];
    }
  }
} catch {
  // fall through to parsed values
}

const map = (arr: Token[], val: (t: Token) => string = (t) => t.value) =>
  Object.fromEntries(arr.map((t) => [t.label, val(t)]));

const out = {
  // Every parsed token (incl. internal `--cds-*` / line-heights) so the story
  // can inject them as inline CSS vars for `var(--token)` rendering.
  raw,
  // The public token groups — this is the JSON people copy.
  grouped: {
    color: map(colors, (t) => validated[t.name] ?? t.value),
    radius: map(radii),
    shadow: map(shadows),
    fontSize: map(typeScale),
    fontFamily: map(fonts),
  },
};

writeFileSync(
  resolve(root, "src/tokens/design-tokens.json"),
  `${JSON.stringify(out, null, 2)}\n`,
);
console.log(
  `generated src/tokens/design-tokens.json — ${tokens.length} tokens ` +
    `(${colors.length} colors, ${radii.length} radii, ${shadows.length} shadows, ` +
    `${typeScale.length} sizes, ${fonts.length} font)`,
);
