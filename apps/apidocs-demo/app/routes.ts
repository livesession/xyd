import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // route("", "./routes/layout.tsx", [
  //   route("*", "./routes/url.tsx"),
  // ]),
  index("./routes/layout.tsx", {id: "index"}),
  layout("./routes/layout.tsx", [
    route("/docs/*", "./routes/url.tsx"),
  ]),
  route("api/try", "./api/try.ts"),
] satisfies RouteConfig;
