import {
  index,
  layout,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  // Public auth routes — siblings of the gated app layout (never hit requireUser).
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/logout.tsx"),
  layout("routes/app-layout.tsx", [
    index("routes/home.tsx"),
    route("registry", "routes/registry.tsx"),
    route("registry/schemas", "routes/registry.schemas.tsx"),
    route("registry/:apiId/:tab?", "routes/registry.detail.tsx"),
    route("docs", "routes/docs.tsx"),
    route("sdks", "routes/sdks.tsx"),
    route("sdks/targets", "routes/sdks.targets.tsx"),
    route("sdks/:sdkId", "routes/sdks.detail.tsx"),
    route("sdks/:sdkId/targets/:targetId", "routes/sdks.target.tsx"),
    route("mcp", "routes/mcp.tsx"),
    route("notifications/:filter?", "routes/notifications.tsx"),
    route("usage", "routes/usage.tsx"),
    route("settings/members", "routes/settings.members.tsx"),
    route("settings/namespaces", "routes/settings.namespaces.tsx"),
    route("settings/connections", "routes/settings.connections.tsx"),
    route(
      "settings/connections/:providerId",
      "routes/settings.connections.$providerId.tsx",
    ),
    route("settings/:tab?", "routes/settings.tsx"),
  ]),
  // Resource route: project switcher + settings mutations (select/create/…).
  route("projects", "routes/projects.tsx"),
  // Resource route (streams the SDK zip) — outside the app layout.
  route("sdks/:sdkId/targets/:targetId/download", "routes/sdks.download.tsx"),
  // Resource route: a provider's repos for the connect-repo picker.
  route("git/repos", "routes/git.repos.tsx"),
  // Resource route: GitHub / GitLab OAuth connect (authorize start + callback).
  route("settings/connections/oauth/:kind", "routes/oauth.connect.tsx"),
  // Quietly 404 agent probes (e.g. Chrome DevTools' /.well-known/... request).
  route(".well-known/*", "routes/well-known.tsx"),
] satisfies RouteConfig;
