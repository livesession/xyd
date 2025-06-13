import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // index("routes/home.tsx"),
  route("", "./routes/layout.tsx", [
    route("*", "./routes/url.tsx"),
  ]),

  // route("*", "routes/home.tsx", {
  //   id: "all"
  // })  // This will match all URLs
  // route("*", "./routes/url.tsx"),
  // route("*", "./url.tsx"),

] satisfies RouteConfig;
