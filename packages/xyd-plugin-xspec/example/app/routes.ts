import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/refactored", "routes/home.refactored.tsx")
] satisfies RouteConfig;
