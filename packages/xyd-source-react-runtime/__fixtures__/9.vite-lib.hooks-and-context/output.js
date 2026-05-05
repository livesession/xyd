// === index.js ===
import { jsx, jsxs } from "react/jsx-runtime";
import { createContext, useState, useContext } from "react";
const ThemeContext = createContext(null);
ThemeContext.displayName = "ThemeContext";
function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light");
  const [primaryColor, setPrimaryColor] = useState("#1976d2");
  const [fontSize, setFontSize] = useState(14);
  const value = {
    mode,
    primaryColor,
    fontSize,
    setMode,
    setPrimaryColor,
    setFontSize
  };
  return jsx(ThemeContext.Provider, { value, children });
}
function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
ThemeContext.__xydUniform = JSON.parse('{"title":"ThemeContext","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"mode","type":"$xor","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"light","type":"string","description":""},{"name":"dark","type":"string","description":""}]},{"name":"primaryColor","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"fontSize","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"setMode","type":"(mode: $xor) => unknown","description":"","meta":[{"name":"required","value":"true"}]},{"name":"setPrimaryColor","type":"(color: string) => unknown","description":"","meta":[{"name":"required","value":"true"}]},{"name":"setFontSize","type":"(size: number) => unknown","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
function Counter({ initialCount = 0, step = 1, onChange }) {
  const [count, setCount] = useState(initialCount);
  const [label, setLabel] = useState("Counter");
  const increment = () => {
    const next = count + step;
    setCount(next);
    onChange == null ? void 0 : onChange(next);
  };
  return jsxs("div", { children: [jsxs("span", { children: [label, ": ", count] }), jsxs("button", { onClick: increment, children: ["+", step] }), jsx("button", { onClick: () => setLabel("Modified"), children: "Rename" })] });
}
Counter.__xydUniform = JSON.parse('{"title":"Counter","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"initialCount","type":"number","description":"Initial count value","meta":[]},{"name":"step","type":"number","description":"Step size for increment/decrement","meta":[]},{"name":"onChange","type":"(count: number) => unknown","description":"Called when count changes","meta":[]}],"meta":[{"name":"type","value":"parameters"}]},{"title":"State","properties":[{"name":"count","type":"unknown","description":"","meta":[{"name":"hookID","value":"0"},{"name":"setter","value":"setCount"}]},{"name":"label","type":"unknown","description":"","meta":[{"name":"hookID","value":"1"},{"name":"setter","value":"setLabel"}]}],"meta":[{"name":"type","value":"state"}]}],"examples":{"groups":[]}}');
export {
  Counter,
  ThemeContext,
  ThemeProvider,
  useTheme
};

