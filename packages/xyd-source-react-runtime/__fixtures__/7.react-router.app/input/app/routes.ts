import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("products/:productId", "routes/product.tsx"),
    route("cart", "routes/cart.tsx"),
] satisfies RouteConfig;
