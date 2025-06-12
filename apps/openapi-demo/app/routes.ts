import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("*", "routes/home.tsx", {
    id: "all"
  })  // This will match all URLs
] satisfies RouteConfig;
