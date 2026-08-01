import { d as h, i as b, V as m, b as u, n as r, c as y } from "./default.styles-CXC3W7cl.js";
import { e as v, s as g } from "./style-property-map-BhmBXb06.js";
import { o as f } from "./if-defined-BliwLxls.js";
const k = [
  h,
  b`
    :host {
      color: var(--vscode-icon-foreground, #cccccc);
      display: inline-block;
    }

    .codicon[class*='codicon-'] {
      display: block;
    }

    .icon,
    .button {
      background-color: transparent;
      display: block;
      padding: 0;
    }

    .button {
      border-color: transparent;
      border-style: solid;
      border-width: 1px;
      border-radius: 5px;
      color: currentColor;
      cursor: pointer;
      padding: 2px;
    }

    .button:hover {
      background-color: var(
        --vscode-toolbar-hoverBackground,
        rgba(90, 93, 94, 0.31)
      );
    }

    .button:active {
      background-color: var(
        --vscode-toolbar-activeBackground,
        rgba(99, 102, 103, 0.31)
      );
    }

    .button:focus {
      outline: none;
    }

    .button:focus-visible {
      border-color: var(--vscode-focusBorder, #0078d4);
    }

    @keyframes icon-spin {
      100% {
        transform: rotate(360deg);
      }
    }

    .spin {
      animation-name: icon-spin;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
  `
];
var s = function(l, e, t, n) {
  var i = arguments.length, c = i < 3 ? e : n === null ? n = Object.getOwnPropertyDescriptor(e, t) : n, d;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") c = Reflect.decorate(l, e, t, n);
  else for (var p = l.length - 1; p >= 0; p--) (d = l[p]) && (c = (i < 3 ? d(c) : i > 3 ? d(e, t, c) : d(e, t)) || c);
  return i > 3 && c && Object.defineProperty(e, t, c), c;
}, a;
let o = a = class extends m {
  constructor() {
    super(...arguments), this.label = "", this.name = "", this.size = 16, this.spin = !1, this.spinDuration = 1.5, this.actionIcon = !1, this._onButtonClick = (e) => {
      this.dispatchEvent(new CustomEvent("vsc-click", { detail: { originalEvent: e } }));
    };
  }
  connectedCallback() {
    super.connectedCallback();
    const { href: e, nonce: t } = this._getStylesheetConfig();
    a.stylesheetHref = e, a.nonce = t;
  }
  /**
   * For using web fonts in web components, the font stylesheet must be included
   * twice: on the page and in the web component. This function looks for the
   * font stylesheet on the page and returns the stylesheet URL and the nonce
   * id.
   */
  _getStylesheetConfig() {
    if (typeof document > "u")
      return { nonce: void 0, href: void 0 };
    const e = document.getElementById("vscode-codicon-stylesheet"), t = e?.getAttribute("href") || void 0, n = e?.nonce || void 0;
    if (!e) {
      let i = 'To use the Icon component, the codicons.css file must be included in the page with the id "vscode-codicon-stylesheet"! ';
      i += "See https://vscode-elements.github.io/components/icon/ for more details.", this.warn(i);
    }
    return { nonce: n, href: t };
  }
  render() {
    const { stylesheetHref: e, nonce: t } = a, n = u`<span
      class=${v({
      codicon: !0,
      ["codicon-" + this.name]: !0,
      spin: this.spin
    })}
      .style=${g({
      animationDuration: String(this.spinDuration) + "s",
      fontSize: this.size + "px",
      height: this.size + "px",
      width: this.size + "px"
    })}
    ></span>`, i = this.actionIcon ? u` <button
          class="button"
          @click=${this._onButtonClick}
          aria-label=${this.label}
        >
          ${n}
        </button>` : u` <span class="icon" aria-hidden="true" role="presentation"
          >${n}</span
        >`;
    return u`
      <link
        rel="stylesheet"
        href=${f(e)}
        nonce=${f(t)}
      />
      ${i}
    `;
  }
};
o.styles = k;
o.stylesheetHref = "";
o.nonce = "";
s([
  r()
], o.prototype, "label", void 0);
s([
  r({ type: String })
], o.prototype, "name", void 0);
s([
  r({ type: Number })
], o.prototype, "size", void 0);
s([
  r({ type: Boolean, reflect: !0 })
], o.prototype, "spin", void 0);
s([
  r({ type: Number, attribute: "spin-duration" })
], o.prototype, "spinDuration", void 0);
s([
  r({ type: Boolean, reflect: !0, attribute: "action-icon" })
], o.prototype, "actionIcon", void 0);
o = a = s([
  y("vscode-icon")
], o);
export {
  o as VscodeIcon
};
