/**
 * Client-safe exports for @xyd-js/plugin-access-control.
 * No Node.js dependencies — safe for browser builds.
 */

export { AccessControlProvider, useAccessControl } from "./components/AccessControlContext";
export type { AccessControlActions } from "./components/AccessControlContext";
export { default as AuthGuard, useAuth } from "./components/AuthGuard";
export { default as LoginPage } from "./components/LoginPage";
export { default as AuthCallbackPage } from "./components/AuthCallbackPage";
export { evaluateAccess, resolvePageAccess, buildAccessMap } from "./access";
export type { AccessMap, AccessLevel, AccessEvaluation } from "./access";
export { filterSidebarGroups, filterProtectedPaths } from "./navigation";
