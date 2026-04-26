// === index.js ===
import { jsx, jsxs } from "react/jsx-runtime";
function StatusBadge({ label, variant, size = "medium", animated }) {
  return jsx("span", { className: `badge badge-${variant} badge-${size} ${animated ? "pulse" : ""}`, children: label });
}
StatusBadge.__xydUniform = JSON.parse('{"title":"StatusBadge","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"label","type":"string","description":"Current status label","meta":[{"name":"required","value":"true"}]},{"name":"variant","type":"$xor","description":"Visual variant","properties":[{"name":"variant","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"variant","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"variant","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"variant","type":"object","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"required","value":"true"}]},{"name":"size","type":"$xor","description":"Size of the badge","properties":[{"name":"size","type":"object","description":"","meta":[]},{"name":"size","type":"object","description":"","meta":[]},{"name":"size","type":"object","description":"","meta":[]}],"meta":[]},{"name":"animated","type":"boolean","description":"Whether the badge should pulse","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
function CardWrapper({ title, children, icon, footer, bordered }) {
  return jsxs("div", { className: `card ${bordered ? "bordered" : ""}`, children: [jsxs("div", { className: "card-header", children: [icon && jsx("span", { className: "card-icon", children: icon }), jsx("h3", { children: title })] }), jsx("div", { className: "card-body", children }), footer && jsx("div", { className: "card-footer", children: footer })] });
}
CardWrapper.__xydUniform = JSON.parse('{"title":"CardWrapper","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"title","type":"string","description":"Card title","meta":[{"name":"required","value":"true"}]},{"name":"children","type":"ReactNode","description":"Card content — React types that typia cannot resolve","meta":[{"name":"required","value":"true"}]},{"name":"icon","type":"ReactElement<unknown, string | JSXElementConstructor<any>> | undefined","description":"Optional icon element","meta":[]},{"name":"footer","type":"ReactNode","description":"Optional footer element","meta":[]},{"name":"bordered","type":"boolean","description":"Whether the card has a border","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
export {
  CardWrapper,
  StatusBadge
};

