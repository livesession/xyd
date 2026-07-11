import { mapSettingsToProps } from "@xyd-js/framework/hydration";
import uniform, {
  type OpenAPIReferenceContext,
  pluginNavigation,
  type Reference,
} from "@xyd-js/uniform";
import { DOCS_PREFIX, EDITOR_SETTINGS } from "~/lib/xyd/editor-settings";
import { attachSdkExamples, attachSdkTypes } from "./sdkExamples.server";
import { specPositions } from "./specPositions";
import { specTextToReferencesAndRaw } from "./specToReferences";

/** The FwSidebar tree — passed opaquely into `<Framework sidebarGroups>`, so we
 * keep it loosely typed here (the Framework component owns the real type). */
export type SidebarGroups = unknown[];

export interface EditorUniform {
  references: Reference[];
  groups: SidebarGroups;
  /** `canonical` → 1-based start line in the raw text, for the Monaco↔Atlas sync
   * (absent from `referencesToUniform`, filled in by `specTextToUniform`). */
  positions?: Record<string, number>;
  /** Parse/convert error, if any — the editor shows it and keeps the last render. */
  error?: string;
}

/**
 * OpenAPI text → `{ references (for Atlas), groups (for the sidebar) }` — the
 * single conversion the loader + the live resource route both call. On a
 * parse/convert failure it returns empty refs/groups plus the message (never
 * throws), so the editor surfaces a diagnostics chip instead of blanking.
 * SERVER-ONLY (see `referencesToUniform`).
 */
export async function specTextToUniform(text: string): Promise<EditorUniform> {
  try {
    const { references, raw } = await specTextToReferencesAndRaw(text);
    const uniform = await referencesToUniform(references);
    // Provider-style SDK usage examples: rewrite each operation's request-sample
    // tabs to one switcher (SDK call per language + curl), generated from the
    // OpenSDK IR (openapi2opensdk needs the RAW $ref'd doc). Best-effort.
    attachSdkExamples(uniform.references, raw);
    // SDK-native definitions: replace the REST "Query/Path/Body params" + Response
    // with the SDK request params type + response type as per-language `sdkLang`
    // variants (and the header method signature on context.sdk). Best-effort.
    attachSdkTypes(uniform.references, raw);
    // Locate each operation in the raw text for the Monaco↔Atlas sync — keyed by
    // the SAME canonicals the Atlas/sidebar use (uniform may have re-mapped refs).
    return { ...uniform, positions: specPositions(text, uniform.references) };
  } catch (err) {
    return {
      references: [],
      groups: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// biome-ignore lint/suspicious/noExplicitAny: xyd Settings/uniform types aren't aliased here (apidocs-demo casts these to any too).
type Loose = any;

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/**
 * uniform `Reference[]` → the xyd sidebar `groups`, the way apps/apidocs-demo's
 * `toUniform` does it: `pluginNavigation` groups operations (by OpenAPI tag) into
 * a sidebar config, `mapSettingsToProps` turns it into the FwSidebar tree, and a
 * `meta.openapi = "#GET /path"` stamp drives the sidebar's HTTP-method badges.
 *
 * SERVER-ONLY: `mapSettingsToProps` pulls `node:path` + `gray-matter`.
 */
export async function referencesToUniform(
  input: Reference[],
): Promise<EditorUniform> {
  const uniformData: Loose = await uniform(input, {
    plugins: [
      pluginNavigation(clone(EDITOR_SETTINGS) as Loose, {
        urlPrefix: DOCS_PREFIX,
      }),
    ],
  });

  const references: Reference[] = uniformData?.references ?? input;

  const settings: Loose = clone(EDITOR_SETTINGS);
  const apisidebar = settings.navigation.sidebar.find(
    (s: Loose) => s.route === DOCS_PREFIX,
  );
  if (uniformData?.out?.sidebar?.length && apisidebar?.pages) {
    apisidebar.pages[0].pages.push(...uniformData.out.sidebar);
  }

  const frontmatter: Loose = uniformData?.out?.pageFrontMatter ?? {};
  for (const ref of references) {
    let canonical = ref.canonical.startsWith("/")
      ? ref.canonical
      : `/${ref.canonical}`;
    if (canonical.endsWith("/")) canonical = canonical.slice(0, -1);
    const meta = frontmatter[`${DOCS_PREFIX}${canonical}`];
    if (!meta) continue;
    const ctx = ref.context as OpenAPIReferenceContext;
    if (ctx?.method && ctx?.path) {
      meta.openapi = `#${ctx.method.toUpperCase()} ${ctx.path}`;
    }
  }

  const props: Loose = await mapSettingsToProps(
    settings,
    {},
    DOCS_PREFIX + (references[0]?.canonical ?? ""),
    frontmatter,
  );

  return { references, groups: props?.groups ?? [] };
}
