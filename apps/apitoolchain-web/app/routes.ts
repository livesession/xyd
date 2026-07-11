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
    route("registry/:apiId", "routes/registry.$apiId.tsx", [
      index("routes/registry.$apiId._index.tsx"),
      route("versions", "routes/registry.$apiId.versions.tsx"),
      route("sdks", "routes/registry.$apiId.sdks.tsx"),
      route("docs", "routes/registry.$apiId.docs.tsx"),
      route("mcp", "routes/registry.$apiId.mcp.tsx"),
      route("releases", "routes/registry.$apiId.releases.tsx"),
      route("repository", "routes/registry.$apiId.repository.tsx"),
      route("settings", "routes/registry.$apiId.settings.tsx"),
    ]),
    route("docs", "routes/docs.tsx"),
    route("sdks", "routes/sdks.tsx"),
    route("sdks/targets", "routes/sdks.targets.tsx"),
    route("sdks/:sdkId", "routes/sdks.$sdkId.tsx", [
      index("routes/sdks.$sdkId._index.tsx"),
      route("versions", "routes/sdks.$sdkId.versions.tsx"),
      route("target-versions", "routes/sdks.$sdkId.target-versions.tsx"),
      route("settings", "routes/sdks.$sdkId.settings.tsx"),
    ]),
    route(
      "sdks/:sdkId/targets/:targetId",
      "routes/sdks.$sdkId.targets.$targetId.tsx",
      [
        index("routes/sdks.$sdkId.targets.$targetId._index.tsx"),
        route("versions", "routes/sdks.$sdkId.targets.$targetId.versions.tsx"),
        route(
          "repository",
          "routes/sdks.$sdkId.targets.$targetId.repository.tsx",
        ),
        route(
          "publishing",
          "routes/sdks.$sdkId.targets.$targetId.publishing.tsx",
        ),
        route("settings", "routes/sdks.$sdkId.targets.$targetId.settings.tsx"),
      ],
    ),
    route("mcp", "routes/mcp.tsx"),
    route("notifications/:filter?", "routes/notifications.tsx"),
    route("usage", "routes/usage.tsx"),
    route("settings/organization", "routes/settings.organization.tsx"),
    route("settings/members", "routes/settings.members.tsx"),
    route("settings/keys", "routes/settings.keys.tsx"),
    route("settings/namespaces", "routes/settings.namespaces.tsx"),
    route("settings/connections", "routes/settings.connections.tsx"),
    route("settings/billing", "routes/settings.billing.tsx"),
    route(
      "settings/connections/:providerId",
      "routes/settings.connections.$providerId.tsx",
    ),
    route("settings/publishing", "routes/settings.publishing.tsx"),
    route("settings/:tab?", "routes/settings.tsx"),
  ]),
  // The full-screen OpenAPI editor — opts out of the app shell for its own
  // 3-pane chrome (like login.tsx). Gated by its own loader's requireUser().
  route("editor/:apiId/:version?", "routes/registry.editor.tsx"),
  // Resource route: live spec text → { references, groups } for the editor's
  // debounced preview (server-only xyd conversion). `editor-uniform`, not
  // `editor/uniform`, so it can't be mistaken for the editor's `:apiId`.
  route("editor-uniform", "routes/registry.editor.uniform.ts"),
  // Resource route: the sdk.json wizard's live preview (server-only real emitters).
  route("api/sdk-preview", "routes/api.sdk-preview.tsx"),
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
