import { d as b, i as f, V as m, b as r, A as u, n as s, c as v } from "./default.styles-CXC3W7cl.js";
const h = [
  b,
  f`
    :host {
      display: block;
      outline: none;
      position: relative;
    }

    .context-menu-item {
      background-color: var(--vscode-menu-background, #1f1f1f);
      color: var(--vscode-menu-foreground, #cccccc);
      display: flex;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 1.4em;
      user-select: none;
      white-space: nowrap;
    }

    .ruler {
      border-bottom: 1px solid var(--vscode-menu-separatorBackground, #454545);
      display: block;
      margin: 0 0 4px;
      padding-top: 4px;
      width: 100%;
    }

    .context-menu-item a {
      align-items: center;
      border-color: transparent;
      border-radius: 3px;
      border-style: solid;
      border-width: 1px;
      box-sizing: border-box;
      color: var(--vscode-menu-foreground, #cccccc);
      cursor: pointer;
      display: flex;
      flex: 1 1 auto;
      height: 2em;
      margin-left: 4px;
      margin-right: 4px;
      outline: none;
      position: relative;
      text-decoration: inherit;
    }

    :host([selected]) .context-menu-item a {
      background-color: var(--vscode-menu-selectionBackground, #0078d4);
      border-color: var(--vscode-menu-selectionBorder, transparent);
      color: var(--vscode-menu-selectionForeground, #ffffff);
    }

    .label {
      background: none;
      display: flex;
      flex: 1 1 auto;
      font-size: 12px;
      line-height: 1;
      padding: 0 22px;
      text-decoration: none;
    }

    .keybinding {
      display: block;
      flex: 2 1 auto;
      line-height: 1;
      padding: 0 22px;
      text-align: right;
    }
  `
];
var n = function(a, o, i, l) {
  var c = arguments.length, e = c < 3 ? o : l === null ? l = Object.getOwnPropertyDescriptor(o, i) : l, d;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") e = Reflect.decorate(a, o, i, l);
  else for (var p = a.length - 1; p >= 0; p--) (d = a[p]) && (e = (c < 3 ? d(e) : c > 3 ? d(o, i, e) : d(o, i)) || e);
  return c > 3 && e && Object.defineProperty(o, i, e), e;
};
let t = class extends m {
  constructor() {
    super(...arguments), this.label = "", this.keybinding = "", this.value = "", this.separator = !1, this.tabindex = 0;
  }
  onItemClick() {
    this.dispatchEvent(new CustomEvent("vsc-click", {
      detail: {
        label: this.label,
        keybinding: this.keybinding,
        value: this.value || this.label,
        separator: this.separator,
        tabindex: this.tabindex
      },
      bubbles: !0,
      composed: !0
    }));
  }
  render() {
    return r`
      ${this.separator ? r`
            <div class="context-menu-item separator">
              <span class="ruler"></span>
            </div>
          ` : r`
            <div class="context-menu-item">
              <a @click=${this.onItemClick}>
                ${this.label ? r`<span class="label">${this.label}</span>` : u}
                ${this.keybinding ? r`<span class="keybinding">${this.keybinding}</span>` : u}
              </a>
            </div>
          `}
    `;
  }
};
t.styles = h;
n([
  s({ type: String })
], t.prototype, "label", void 0);
n([
  s({ type: String })
], t.prototype, "keybinding", void 0);
n([
  s({ type: String })
], t.prototype, "value", void 0);
n([
  s({ type: Boolean, reflect: !0 })
], t.prototype, "separator", void 0);
n([
  s({ type: Number })
], t.prototype, "tabindex", void 0);
t = n([
  v("vscode-context-menu-item")
], t);
export {
  t as VscodeContextMenuItem
};
