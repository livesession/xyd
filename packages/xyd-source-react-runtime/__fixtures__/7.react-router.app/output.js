// === client/assets/home-HASH.js ===
import { p as jsxRuntimeExports, t as Link, w as withComponentProps, a as reactExports } from "./chunk-HASH.js";
function ProductCard({ product, onAddToCart, layout = "grid" }) {
  return jsxRuntimeExports.jsxs("div", { className: `product-card product-card--${layout}`, children: [jsxRuntimeExports.jsx(Link, { to: `/products/${product.id}`, children: jsxRuntimeExports.jsx("h3", { children: product.name }) }), jsxRuntimeExports.jsxs("span", { children: ["$", product.price] }), jsxRuntimeExports.jsx("button", { type: "button", disabled: !product.inStock, onClick: () => onAddToCart(product.id), children: product.inStock ? "Add to Cart" : "Out of Stock" })] });
}
ProductCard.__xydUniform = JSON.parse('{"title":"ProductCard","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"product","type":"object","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"id","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"name","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"price","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"category","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"inStock","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]}]},{"name":"onAddToCart","type":"(productId: string) => unknown","description":"","meta":[{"name":"required","value":"true"}]},{"name":"layout","type":"$xor","description":"","meta":[],"properties":[{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]}]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
const PRODUCTS = [{
  id: "1",
  name: "Keyboard",
  price: 79,
  category: "peripherals",
  inStock: true
}, {
  id: "2",
  name: "Mouse",
  price: 49,
  category: "peripherals",
  inStock: true
}, {
  id: "3",
  name: "Monitor",
  price: 399,
  category: "displays",
  inStock: false
}];
const home = withComponentProps(function Home() {
  const [cart, setCart] = reactExports.useState([]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
    children: [/* @__PURE__ */ jsxRuntimeExports.jsx("h1", {
      children: "Shop"
    }), /* @__PURE__ */ jsxRuntimeExports.jsxs("p", {
      children: [cart.length, " items in cart"]
    }), /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
      children: PRODUCTS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(ProductCard, {
        product: p,
        onAddToCart: (id) => setCart((prev) => [...prev, id])
      }, p.id))
    })]
  });
});
export {
  home as default
};


// === client/assets/root-HASH.js ===
import { w as withComponentProps, p as jsxRuntimeExports, M as Meta, L as Links, S as ScrollRestoration, q as Scripts, O as Outlet } from "./chunk-HASH.js";
function Layout({
  children
}) {
  return jsxRuntimeExports.jsxs("html", {
    lang: "en",
    children: [jsxRuntimeExports.jsxs("head", {
      children: [jsxRuntimeExports.jsx("meta", {
        charSet: "utf-8"
      }), jsxRuntimeExports.jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), jsxRuntimeExports.jsx(Meta, {}), jsxRuntimeExports.jsx(Links, {})]
    }), jsxRuntimeExports.jsxs("body", {
      children: [children, jsxRuntimeExports.jsx(ScrollRestoration, {}), jsxRuntimeExports.jsx(Scripts, {})]
    })]
  });
}
const root = withComponentProps(function Root() {
  return jsxRuntimeExports.jsx(Outlet, {});
});
Layout.__xydUniform = JSON.parse('{"title":"Layout","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"children","type":"ReactNode","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
export {
  Layout,
  root as default
};

