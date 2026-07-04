import {
  index,
  layout,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/app-layout.tsx", [
    index("routes/home.tsx"),
    route("registry", "routes/registry.tsx"),
    route("registry/:apiId", "routes/registry.detail.tsx"),
    route("docs", "routes/docs.tsx"),
    route("sdks", "routes/sdks.tsx"),
    route("mcp", "routes/mcp.tsx"),
    route("notifications", "routes/notifications.tsx"),
    route("usage", "routes/usage.tsx"),
    route("settings", "routes/settings.tsx"),
    route("settings/repos", "routes/settings.repos.tsx"),
  ]),
] satisfies RouteConfig;
