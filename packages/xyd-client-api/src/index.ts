/**
 * @xyd-js/client-api — Unified client API for xyd.
 *
 * One import for all xyd hooks, contexts, and utilities.
 * Safe for browser builds — no Node.js dependencies.
 *
 * @example
 * ```tsx
 * import { useSettings, useAccessControl, useAnalytics } from "@xyd-js/client-api"
 * ```
 */

// ─── Framework ───
export {
  useSettings,
  useMetadata,
  useAppearance,
  useShowColorSchemeButton,
  useComponents,
  useContentComponent,
  useContentOriginal,
  useEditLink,
} from "@xyd-js/framework/react";

// ─── Framework: Navigation hooks ───
export {
  useMatchedSubNav,
  useActiveRoute,
  useActivePageRoute,
  useActivePage,
} from "@xyd-js/framework/react";

// ─── Access Control plugin ───
export {
  AccessControlProvider,
  useAccessControl,
} from "@xyd-js/plugin-access-control/AccessControlContext";
export type { AccessControlActions } from "@xyd-js/plugin-access-control/AccessControlContext";

// ─── Analytics ───
export { useAnalytics } from "@xyd-js/analytics";

// ─── Search ───
export { filterSearchDocs } from "@xyd-js/content/search";

// ─── Types ───
export type { PageApi } from "@xyd-js/core";
export type { MetaTags } from "@xyd-js/core";
