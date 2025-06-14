import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("", "./routes/layout.tsx", [
    route("/docs/api/*", "./routes/url.tsx"),
  ]),
  route("api/try", "./api/try.ts"),
] satisfies RouteConfig;
