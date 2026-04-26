// === assets/main-HASH.js ===
import "./modulepreload-polyfill-HASH.js";
import { j as jsxRuntimeExports } from "./jsx-runtime-HASH.js";
import { a as clientExports } from "./client-HASH.js";
import "./index-HASH.js";
function NavBar({ title, links, dark }) {
  return jsxRuntimeExports.jsxs("nav", { style: { background: dark ? "#222" : "#f5f5f5", padding: 8 }, children: [jsxRuntimeExports.jsx("strong", { children: title }), jsxRuntimeExports.jsx("ul", { children: links.map((link) => jsxRuntimeExports.jsx("li", { children: link }, link)) })] });
}
function App() {
  return jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsx(NavBar, { title: "Playground", links: ["Home", "About"] }), jsxRuntimeExports.jsx("iframe", { src: "/sample-app.html", style: { width: "100%", height: 400, border: "none" } })] });
}
const root = clientExports.createRoot(document.getElementById("root"));
root.render(jsxRuntimeExports.jsx(App, {}));
NavBar.__xydUniform = JSON.parse('{"title":"NavBar","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"title","type":"string","description":"Application title","meta":[{"name":"required","value":"true"}]},{"name":"links","type":"$array","description":"Navigation links","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"string","properties":[],"description":"","meta":[{"name":"required","value":"true"}]}},{"name":"dark","type":"boolean","description":"Whether to use dark theme","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');


// === assets/sample-app-HASH.js ===
import { j as jsxRuntimeExports } from "./jsx-runtime-HASH.js";
import { r as reactExports } from "./index-HASH.js";
import "./index-HASH.js";
const ThemeContext = reactExports.createContext(null);
function ThemeProvider({ children }) {
  const [mode, setMode] = reactExports.useState("light");
  return jsxRuntimeExports.jsx(ThemeContext.Provider, { value: { mode, setMode }, children });
}
function UserCard({ user, role, permissions, onEdit, tags, statusIndicator, actionBar }) {
  const [expanded, setExpanded] = reactExports.useState(false);
  reactExports.useContext(ThemeContext);
  return jsxRuntimeExports.jsxs("div", { style: { border: "1px solid #eee", padding: 12, borderRadius: 8, marginBottom: 8 }, children: [jsxRuntimeExports.jsx("strong", { children: user.name }), " (", role, ")", jsxRuntimeExports.jsx("div", { style: { fontSize: 12 }, children: user.email }), jsxRuntimeExports.jsx("div", { children: permissions.join(", ") }), jsxRuntimeExports.jsx("div", { children: statusIndicator }), actionBar, jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setExpanded(!expanded), children: expanded ? "Hide" : "Show" }), expanded && jsxRuntimeExports.jsxs("div", { children: [jsxRuntimeExports.jsxs("div", { children: ["ID: ", user.id] }), jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onEdit(user.id), children: "Edit" })] })] });
}
function TodoItem({ id, title, completed, priority, onToggle }) {
  return jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, padding: 4 }, children: [jsxRuntimeExports.jsx("input", { type: "checkbox", checked: completed, onChange: () => onToggle(id) }), jsxRuntimeExports.jsx("span", { style: { textDecoration: completed ? "line-through" : "none" }, children: title }), jsxRuntimeExports.jsxs("span", { children: ["(", priority, ")"] })] });
}
function SampleApp() {
  return jsxRuntimeExports.jsxs(ThemeProvider, { children: [jsxRuntimeExports.jsx("h3", { children: "Sample App (iframe)" }), jsxRuntimeExports.jsx(UserCard, { user: { name: "Alice", email: "alice@test.com", id: 1, joinedAt: /* @__PURE__ */ new Date() }, role: "admin", permissions: ["read", "write"], onEdit: (id) => console.log("edit", id), tags: /* @__PURE__ */ new Map([["verified", true]]), statusIndicator: jsxRuntimeExports.jsx("span", { children: "Active" }) }), jsxRuntimeExports.jsx(TodoItem, { id: 1, title: "Write docs", completed: false, priority: "high", onToggle: () => {
  } })] });
}
ThemeContext.__xydUniform = JSON.parse('{"title":"ThemeContext","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"mode","type":"$xor","description":"","properties":[{"name":"mode","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"mode","type":"object","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
UserCard.__xydUniform = JSON.parse('{"title":"UserCard","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"user","type":"User","description":"","meta":[{"name":"required","value":"true"}]},{"name":"role","type":"$xor","description":"","properties":[{"name":"role","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"role","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"role","type":"string","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"required","value":"true"}]},{"name":"permissions","type":"$array","description":"","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"string","properties":[],"description":"","meta":[{"name":"required","value":"true"}]}},{"name":"onEdit","type":"(id: number) => void","description":"","meta":[{"name":"required","value":"true"}]},{"name":"tags","type":"Map<string, boolean>","description":"","meta":[{"name":"required","value":"true"}]},{"name":"statusIndicator","type":"ReactElement<unknown, string | JSXElementConstructor<any>>","description":"","meta":[{"name":"required","value":"true"}]},{"name":"actionBar","type":"ReactNode","description":"","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
TodoItem.__xydUniform = JSON.parse('{"title":"TodoItem","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"id","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"title","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"completed","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]},{"name":"priority","type":"$xor","description":"","properties":[{"name":"priority","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"priority","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"priority","type":"object","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
export {
  SampleApp,
  ThemeContext,
  ThemeProvider,
  TodoItem,
  UserCard
};

