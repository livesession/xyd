// === client/assets/home-HASH.js ===
import { p as jsxRuntimeExports, t as Link, w as withComponentProps, a as reactExports } from "./chunk-EVOBXE3Y-HASH.js";
function ProductCard({ product, onAddToCart, layout = "grid" }) {
  return jsxRuntimeExports.jsxs("div", { className: `product-card product-card--${layout}`, children: [jsxRuntimeExports.jsx(Link, { to: `/products/${product.id}`, children: jsxRuntimeExports.jsx("h3", { children: product.name }) }), jsxRuntimeExports.jsxs("span", { children: ["$", product.price] }), jsxRuntimeExports.jsx("button", { type: "button", disabled: !product.inStock, onClick: () => onAddToCart(product.id), children: product.inStock ? "Add to Cart" : "Out of Stock" })] });
}
ProductCard.__xydUniform = JSON.parse('{"title":"ProductCard","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"product","type":"object","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"id","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"name","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"price","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"category","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"inStock","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]}]},{"name":"layout","type":"$xor","description":"","properties":[{"name":"layout","type":"object","description":"","meta":[]},{"name":"layout","type":"object","description":"","meta":[]}],"meta":[]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
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

