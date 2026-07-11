import { E as n } from "./default.styles-CXC3W7cl.js";
const o = { ATTRIBUTE: 1, PROPERTY: 3 }, h = (s) => (...e) => ({ _$litDirective$: s, values: e });
class c {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, r, t) {
    this._$Ct = e, this._$AM = r, this._$Ci = t;
  }
  _$AS(e, r) {
    return this.update(e, r);
  }
  update(e, r) {
    return this.render(...r);
  }
}
const p = h(class extends c {
  constructor(s) {
    if (super(s), s.type !== o.ATTRIBUTE || s.name !== "class" || s.strings?.length > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
  }
  render(s) {
    return " " + Object.keys(s).filter((e) => s[e]).join(" ") + " ";
  }
  update(s, [e]) {
    if (this.st === void 0) {
      this.st = /* @__PURE__ */ new Set(), s.strings !== void 0 && (this.nt = new Set(s.strings.join(" ").split(/\s/).filter((t) => t !== "")));
      for (const t in e) e[t] && !this.nt?.has(t) && this.st.add(t);
      return this.render(e);
    }
    const r = s.element.classList;
    for (const t of this.st) t in e || (r.remove(t), this.st.delete(t));
    for (const t in e) {
      const i = !!e[t];
      i === this.st.has(t) || this.nt?.has(t) || (i ? (r.add(t), this.st.add(t)) : (r.remove(t), this.st.delete(t)));
    }
    return n;
  }
});
class a extends c {
  constructor(e) {
    if (super(e), this._prevProperties = {}, e.type !== o.PROPERTY || e.name !== "style")
      throw new Error("The `stylePropertyMap` directive must be used in the `style` property");
  }
  update(e, [r]) {
    return Object.entries(r).forEach(([t, i]) => {
      this._prevProperties[t] !== i && (t.startsWith("--") ? e.element.style.setProperty(t, i) : e.element.style[t] = i, this._prevProperties[t] = i);
    }), n;
  }
  render(e) {
    return n;
  }
}
const d = h(a);
export {
  p as e,
  d as s
};
