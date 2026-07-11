import {
  type BundledLanguage,
  createHighlighter,
  type Highlighter,
} from "shiki";

/**
 * Shared shiki highlighter singleton — used by the read-only CodePreview AND the
 * editable JSON editor (a transparent textarea over this highlight layer), so
 * grammars + theme load exactly once.
 */

export const HL_THEME = "github-light";
const LANGS: BundledLanguage[] = [
  "typescript",
  "javascript",
  "go",
  "python",
  "ruby",
  "java",
  "csharp",
  "json",
  "markdown",
  "toml",
  "xml",
  "yaml",
];
export const LANG_SET = new Set<string>(LANGS);

let highlighterPromise: Promise<Highlighter> | null = null;
export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [HL_THEME],
      langs: LANGS,
    });
  }
  return highlighterPromise;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Highlight synchronously once the highlighter is loaded (for editors). */
export function highlightSync(
  hl: Highlighter,
  code: string,
  language: string,
): string {
  const lang = LANG_SET.has(language) ? language : "text";
  try {
    return hl.codeToHtml(code, { lang, theme: HL_THEME });
  } catch {
    return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;
  }
}

const cache = new Map<string, string>();
/** Async + cached full-`<pre>` HTML (for read-only viewers). */
export async function highlightToHtml(
  code: string,
  language: string,
): Promise<string> {
  const lang = LANG_SET.has(language) ? language : "text";
  const key = `${HL_THEME}:${lang}:${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const hl = await getHighlighter();
  const out = highlightSync(hl, code, language);
  cache.set(key, out);
  return out;
}
