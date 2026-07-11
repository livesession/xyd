import { d as p, i as m, V as _, A as f, b as a, n as h, c as I } from "./default.styles-CXC3W7cl.js";
import { r as u } from "./state-Cw8Ci1Wr.js";
import { e as x } from "./query-CUjKX5wI.js";
import "./index-C6ZzTuQb.js";
const b = [
  p,
  m`
    :host {
      display: block;
      position: relative;
    }

    .context-menu {
      background-color: var(--vscode-menu-background, #1f1f1f);
      border-color: var(--vscode-menu-border, #454545);
      border-radius: 5px;
      border-style: solid;
      border-width: 1px;
      box-shadow: 0 2px 8px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.36));
      color: var(--vscode-menu-foreground, #cccccc);
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 1.4em;
      padding: 4px 0;
      white-space: nowrap;
    }

    .context-menu:focus {
      outline: 0;
    }
  `
];
var c = function(r, e, t, s) {
  var o = arguments.length, n = o < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, l;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") n = Reflect.decorate(r, e, t, s);
  else for (var d = r.length - 1; d >= 0; d--) (l = r[d]) && (n = (o < 3 ? l(n) : o > 3 ? l(e, t, n) : l(e, t)) || n);
  return o > 3 && n && Object.defineProperty(e, t, n), n;
};
let i = class extends _ {
  set data(e) {
    this._data = e;
    const t = [];
    e.forEach((s, o) => {
      s.separator || t.push(o);
    }), this._clickableItemIndexes = t;
  }
  get data() {
    return this._data;
  }
  set show(e) {
    this._show = e, this._selectedClickableItemIndex = -1, e && this.updateComplete.then(() => {
      this._wrapperEl && this._wrapperEl.focus(), requestAnimationFrame(() => {
        document.addEventListener("click", this._onClickOutsideBound, {
          once: !0
        });
      });
    });
  }
  get show() {
    return this._show;
  }
  constructor() {
    super(), this.preventClose = !1, this.tabIndex = 0, this._selectedClickableItemIndex = -1, this._show = !1, this._data = [], this._clickableItemIndexes = [], this._onClickOutsideBound = this._onClickOutside.bind(this), this.addEventListener("keydown", this._onKeyDown);
  }
  _onClickOutside(e) {
    e.composedPath().includes(this) || (this.show = !1);
  }
  _onKeyDown(e) {
    const { key: t } = e;
    switch ((t === "ArrowUp" || t === "ArrowDown" || t === "Escape" || t === "Enter") && e.preventDefault(), t) {
      case "ArrowUp":
        this._handleArrowUp();
        break;
      case "ArrowDown":
        this._handleArrowDown();
        break;
      case "Escape":
        this._handleEscape();
        break;
      case "Enter":
        this._handleEnter();
        break;
    }
  }
  _handleArrowUp() {
    this._selectedClickableItemIndex === 0 ? this._selectedClickableItemIndex = this._clickableItemIndexes.length - 1 : this._selectedClickableItemIndex -= 1;
  }
  _handleArrowDown() {
    this._selectedClickableItemIndex + 1 < this._clickableItemIndexes.length ? this._selectedClickableItemIndex += 1 : this._selectedClickableItemIndex = 0;
  }
  _handleEscape() {
    this.show = !1, document.removeEventListener("click", this._onClickOutsideBound);
  }
  _dispatchSelectEvent(e) {
    const { keybinding: t, label: s, value: o, separator: n, tabindex: l } = e;
    this.dispatchEvent(new CustomEvent("vsc-context-menu-select", {
      detail: {
        keybinding: t,
        label: s,
        separator: n,
        tabindex: l,
        value: o
      }
    }));
  }
  _handleEnter() {
    if (this._selectedClickableItemIndex === -1)
      return;
    const e = this._clickableItemIndexes[this._selectedClickableItemIndex], s = this._wrapperEl.querySelectorAll("vscode-context-menu-item")[e];
    this._dispatchSelectEvent(s), this.preventClose || (this.show = !1, document.removeEventListener("click", this._onClickOutsideBound));
  }
  _onItemClick(e) {
    const t = e.currentTarget;
    this._dispatchSelectEvent(t), this.preventClose || (this.show = !1);
  }
  _onItemMouseOver(e) {
    const t = e.target, s = t.dataset.index ? +t.dataset.index : -1, o = this._clickableItemIndexes.findIndex((n) => n === s);
    o !== -1 && (this._selectedClickableItemIndex = o);
  }
  _onItemMouseOut() {
    this._selectedClickableItemIndex = -1;
  }
  render() {
    if (!this._show)
      return a`${f}`;
    const e = this._clickableItemIndexes[this._selectedClickableItemIndex];
    return a`
      <div class="context-menu" tabindex="0">
        ${this.data ? this.data.map(({ label: t = "", keybinding: s = "", value: o = "", separator: n = !1, tabindex: l = 0 }, d) => a`
                <vscode-context-menu-item
                  label=${t}
                  keybinding=${s}
                  value=${o}
                  ?separator=${n}
                  ?selected=${d === e}
                  tabindex=${l}
                  @vsc-click=${this._onItemClick}
                  @mouseover=${this._onItemMouseOver}
                  @mouseout=${this._onItemMouseOut}
                  data-index=${d}
                ></vscode-context-menu-item>
              `) : a`<slot></slot>`}
      </div>
    `;
  }
};
i.styles = b;
c([
  h({ type: Array, attribute: !1 })
], i.prototype, "data", null);
c([
  h({ type: Boolean, reflect: !0, attribute: "prevent-close" })
], i.prototype, "preventClose", void 0);
c([
  h({ type: Boolean, reflect: !0 })
], i.prototype, "show", null);
c([
  h({ type: Number, reflect: !0 })
], i.prototype, "tabIndex", void 0);
c([
  u()
], i.prototype, "_selectedClickableItemIndex", void 0);
c([
  u()
], i.prototype, "_show", void 0);
c([
  x(".context-menu")
], i.prototype, "_wrapperEl", void 0);
i = c([
  I("vscode-context-menu")
], i);
export {
  i as VscodeContextMenu
};
