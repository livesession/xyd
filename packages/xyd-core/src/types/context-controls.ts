import type { ComponentPageImport } from "./settings";

// ---------------------------------------------------------------------------
// Page context controls — contextual page actions (copy page, view markdown,
// open in ChatGPT/Claude, MCP URL), a content-version switcher, explicit
// dropdown grouping, and fully custom components. Declared globally under
// `components.contextControls`, per page via frontmatter (`contextControls:`),
// or on the sidebar page entry (`{ page, contextControls }`). A page-level
// declaration REPLACES the global one (sidebar entry > frontmatter > global;
// `[]` opts a page out entirely).
// ---------------------------------------------------------------------------

/** Where a control renders: the content header row, above the TOC, or below it. */
export type ContextControlAppearance = "header" | "toc-top" | "toc-bottom";

/** Option-less built-in actions usable as bare-string shorthands, e.g.
 * `contextControls: ["copy"]`. */
export type ContextControlActionName = "copy" | "view-markdown" | "chatgpt" | "claude";

interface ContextControlBase {
  /** Slot to render in. Default `"header"`. */
  appearance?: ContextControlAppearance;
  /** Display label override. */
  label?: string;
  /** Icon override — an icon-set name (e.g. `lucide:copy`) or an image path. */
  icon?: string;
  /** Subtitle shown on menu rows (inside a `dropdown`). */
  description?: string;
}

/** Copy the page's raw markdown to the clipboard. */
export interface ContextControlCopy extends ContextControlBase {
  type: "copy";
}

/** Open the page's raw markdown (`<page-url>.md`) in a new tab. */
export interface ContextControlViewMarkdown extends ContextControlBase {
  type: "view-markdown";
}

/** Open ChatGPT pre-prompted with the page's raw-markdown URL. */
export interface ContextControlChatGPT extends ContextControlBase {
  type: "chatgpt";
}

/** Open Claude pre-prompted with the page's raw-markdown URL. */
export interface ContextControlClaude extends ContextControlBase {
  type: "claude";
}

/** Copy the docs' MCP server URL to the clipboard. */
export interface ContextControlMCP extends ContextControlBase {
  type: "mcp";
  options: {
    /** The MCP server URL to copy. */
    url: string;
  };
}

/** The built-in action controls (leaf buttons / dropdown rows). */
export type ContextControlAction =
  | ContextControlCopy
  | ContextControlViewMarkdown
  | ContextControlChatGPT
  | ContextControlClaude
  | ContextControlMCP;

/**
 * EXPLICIT combining: one dropdown whose menu rows are the nested actions
 * (Mintlify-contextual style). Anything not grouped renders as its own
 * button/widget.
 */
export interface ContextControlDropdown extends ContextControlBase {
  type: "dropdown";
  options: {
    controls: (ContextControlActionName | ContextControlAction)[];
  };
}

/** One selectable variant of the current page's content. Exactly one mode
 * per control: every version has `page` (navigate mode), or versions use
 * `source` (same-URL swap mode — a version without `source` is the host
 * page's own content). */
export interface ContentVersionOption {
  title: string;
  description?: string;
  icon?: string;
  /** Navigate mode: URL slug of the variant page — pairs naturally with
   * `{ page, source }` virtual pages (variant files sharing a URL scheme). */
  page?: string;
  /** Same-URL swap mode: markdown file path (extension-less) whose content
   * replaces the page's, selected via the query param — the URL pathname
   * never changes. */
  source?: string;
  /** Stable id used in the query param (`?<queryParam>=<value>`).
   * Defaults to the slugified title. */
  value?: string;
}

/**
 * A content-version switcher: a dropdown listing variants of the current
 * page (e.g. per-framework/product docs). In navigate mode picking one
 * navigates to its page; in same-URL swap mode picking one sets
 * `?<queryParam>=<value>` and the page's CONTENT swaps in place (the
 * variant is compiled server-side, so deep links render it immediately).
 * The active row is marked.
 */
export interface ContextControlContentVersion extends ContextControlBase {
  type: "content-version";
  options: {
    versions: ContentVersionOption[];
    /** Query param driving same-URL swap mode (configurable).
     * Default `"version"`. */
    queryParam?: string;
  };
}

/** A fully custom control — a project-local React component, the same
 * `{ import, props }` pattern as `ComponentPage.component`. */
export interface ContextControlCustom extends ContextControlBase {
  type: "custom";
  component: string | ComponentPageImport;
}

/** One context control: a bare action name (simple form) or a typed object. */
export type ContextControl =
  | ContextControlActionName
  | ContextControlAction
  | ContextControlDropdown
  | ContextControlContentVersion
  | ContextControlCustom;

export type ContextControls = ContextControl[];
