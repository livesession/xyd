import { d as v, i as S, V as b, b as C, n as d, c as I } from "./default.styles-CXC3W7cl.js";
import { e as w } from "./base-FqLVMEt3.js";
function y(s) {
  return (e, t) => {
    const { slot: i, selector: n } = s ?? {}, o = "slot" + (i ? `[name=${i}]` : ":not([name])");
    return w(e, t, { get() {
      const r = this.renderRoot?.querySelector(o), l = r?.assignedElements(s) ?? [];
      return n === void 0 ? l : l.filter((_) => _.matches(n));
    } });
  };
}
let E = class extends Event {
  constructor(e, t, i, n) {
    super("context-request", { bubbles: !0, composed: !0 }), this.context = e, this.contextTarget = t, this.callback = i, this.subscribe = n ?? !1;
  }
};
class k {
  get value() {
    return this.o;
  }
  set value(e) {
    this.setValue(e);
  }
  setValue(e, t = !1) {
    const i = t || !Object.is(e, this.o);
    this.o = e, i && this.updateObservers();
  }
  constructor(e) {
    this.subscriptions = /* @__PURE__ */ new Map(), this.updateObservers = () => {
      for (const [t, { disposer: i }] of this.subscriptions) t(this.o, i);
    }, e !== void 0 && (this.value = e);
  }
  addCallback(e, t, i) {
    if (!i) return void e(this.value);
    this.subscriptions.has(e) || this.subscriptions.set(e, { disposer: () => {
      this.subscriptions.delete(e);
    }, consumerHost: t });
    const { disposer: n } = this.subscriptions.get(e);
    e(this.value, n);
  }
  clearCallbacks() {
    this.subscriptions.clear();
  }
}
let P = class extends Event {
  constructor(e, t) {
    super("context-provider", { bubbles: !0, composed: !0 }), this.context = e, this.contextTarget = t;
  }
};
class p extends k {
  constructor(e, t, i) {
    super(t.context !== void 0 ? t.initialValue : i), this.onContextRequest = (n) => {
      if (n.context !== this.context) return;
      const o = n.contextTarget ?? n.composedPath()[0];
      o !== this.host && (n.stopPropagation(), this.addCallback(n.callback, o, n.subscribe));
    }, this.onProviderRequest = (n) => {
      if (n.context !== this.context || (n.contextTarget ?? n.composedPath()[0]) === this.host) return;
      const o = /* @__PURE__ */ new Set();
      for (const [r, { consumerHost: l }] of this.subscriptions) o.has(r) || (o.add(r), l.dispatchEvent(new E(this.context, l, r, !0)));
      n.stopPropagation();
    }, this.host = e, t.context !== void 0 ? this.context = t.context : this.context = t, this.attachListeners(), this.host.addController?.(this);
  }
  attachListeners() {
    this.host.addEventListener("context-request", this.onContextRequest), this.host.addEventListener("context-provider", this.onProviderRequest);
  }
  hostConnected() {
    this.host.dispatchEvent(new P(this.context, this.host));
  }
}
function m({ context: s }) {
  return (e, t) => {
    const i = /* @__PURE__ */ new WeakMap();
    if (typeof t == "object") return { get() {
      return e.get.call(this);
    }, set(n) {
      return i.get(this).setValue(n), e.set.call(this, n);
    }, init(n) {
      return i.set(this, new p(this, { context: s, initialValue: n })), n;
    } };
    {
      e.constructor.addInitializer(((r) => {
        i.set(r, new p(r, { context: s }));
      }));
      const n = Object.getOwnPropertyDescriptor(e, t);
      let o;
      if (n === void 0) {
        const r = /* @__PURE__ */ new WeakMap();
        o = { get() {
          return r.get(this);
        }, set(l) {
          i.get(this).setValue(l), r.set(this, l);
        }, configurable: !0, enumerable: !0 };
      } else {
        const r = n.set;
        o = { ...n, set(l) {
          i.get(this).setValue(l), r?.call(this, l);
        } };
      }
      return void Object.defineProperty(e, t, o);
    }
  };
}
const A = [
  v,
  S`
    :host {
      --vsc-tree-item-arrow-display: flex;
      --internal-selectionBackground: var(
        --vscode-list-inactiveSelectionBackground,
        #37373d
      );
      --internal-selectionForeground: var(--vscode-foreground, #cccccc);
      --internal-selectionIconForeground: var(
        --vscode-icon-foreground,
        #cccccc
      );
      --internal-defaultIndentGuideDisplay: none;
      --internal-highlightedIndentGuideDisplay: block;

      display: block;
    }

    :host(:hover) {
      --internal-defaultIndentGuideDisplay: block;
      --internal-highlightedIndentGuideDisplay: block;
    }

    :host(:focus-within) {
      --internal-selectionBackground: var(
        --vscode-list-activeSelectionBackground,
        #04395e
      );
      --internal-selectionForeground: var(
        --vscode-list-activeSelectionForeground,
        #ffffff
      );
      --internal-selectionIconForeground: var(
        --vscode-list-activeSelectionIconForeground,
        #ffffff
      );
    }

    :host([hide-arrows]) {
      --vsc-tree-item-arrow-display: none;
    }

    :host([indent-guides='none']),
    :host([indent-guides='none']:hover) {
      --internal-defaultIndentGuideDisplay: none;
      --internal-highlightedIndentGuideDisplay: none;
    }

    :host([indent-guides='always']),
    :host([indent-guides='always']:hover) {
      --internal-defaultIndentGuideDisplay: block;
      --internal-highlightedIndentGuideDisplay: block;
    }
  `
], G = "vscode-list", D = /* @__PURE__ */ Symbol("configContext"), a = (s) => s instanceof Element && s.matches("vscode-tree-item"), T = (s) => s instanceof Element && s.matches("vscode-tree"), O = (s, e) => {
  const t = e.length, i = T(s) ? -1 : s.level;
  "branch" in s && (s.branch = t > 0), e.forEach((n, o) => {
    "path" in s ? n.path = [...s.path, o] : n.path = [o], n.level = i + 1, n.dataset.path = n.path.join(".");
  });
}, x = (s) => {
  const e = s.lastElementChild;
  return !e || !a(e) ? s : e.branch && e.open ? x(e) : e;
}, u = (s) => {
  if (!s.parentElement || !a(s.parentElement))
    return null;
  const e = f(s.parentElement);
  return e || u(s.parentElement);
}, f = (s) => {
  let e = s.nextElementSibling;
  for (; e && !a(e); )
    e = e.nextElementSibling;
  return e;
}, L = (s) => {
  const { parentElement: e } = s;
  if (!e || !a(s))
    return null;
  let t;
  if (s.branch && s.open) {
    const i = s.querySelector("vscode-tree-item");
    i ? t = i : (t = f(s), t || (t = u(s)));
  } else
    t = f(s), t || (t = u(s));
  return t || s;
}, R = (s) => {
  const { parentElement: e } = s;
  if (!e || !a(s))
    return null;
  let t = s.previousElementSibling;
  for (; t && !a(t); )
    t = t.previousElementSibling;
  return !t && a(e) ? e : t && t.branch && t.open ? x(t) : t;
};
function g(s) {
  return !s.parentElement || !a(s.parentElement) ? null : s.parentElement;
}
var h = function(s, e, t, i) {
  var n = arguments.length, o = n < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, r;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") o = Reflect.decorate(s, e, t, i);
  else for (var l = s.length - 1; l >= 0; l--) (r = s[l]) && (o = (n < 3 ? r(o) : n > 3 ? r(e, t, o) : r(e, t)) || o);
  return n > 3 && o && Object.defineProperty(e, t, o), o;
};
const F = {
  singleClick: "singleClick",
  doubleClick: "doubleClick"
}, M = {
  none: "none"
}, V = [
  " ",
  "ArrowDown",
  "ArrowUp",
  "ArrowLeft",
  "ArrowRight",
  "Enter",
  "Escape",
  "Shift"
];
let c = class extends b {
  //#endregion
  //#region lifecycle methods
  constructor() {
    super(), this.expandMode = "singleClick", this.hideArrows = !1, this.indent = 8, this.indentGuides = "onHover", this.multiSelect = !1, this._treeContextState = {
      isShiftPressed: !1,
      activeItem: null,
      selectedItems: /* @__PURE__ */ new Set(),
      hoveredItem: null,
      allItems: null,
      itemListUpToDate: !1,
      focusedItem: null,
      prevFocusedItem: null,
      hasBranchItem: !1,
      rootElement: this,
      highlightedItems: /* @__PURE__ */ new Set(),
      highlightIndentGuides: () => {
        this._highlightIndentGuides();
      },
      emitSelectEvent: () => {
        this._emitSelectEvent();
      }
    }, this._configContext = {
      hideArrows: this.hideArrows,
      expandMode: this.expandMode,
      indent: this.indent,
      indentGuides: this.indentGuides,
      multiSelect: this.multiSelect
    }, this._handleComponentKeyDown = (e) => {
      const t = e.key;
      switch (V.includes(t) && (e.stopPropagation(), e.preventDefault()), t) {
        case " ":
        case "Enter":
          this._handleEnterPress();
          break;
        case "ArrowDown":
          this._handleArrowDownPress();
          break;
        case "ArrowLeft":
          this._handleArrowLeftPress(e);
          break;
        case "ArrowRight":
          this._handleArrowRightPress();
          break;
        case "ArrowUp":
          this._handleArrowUpPress();
          break;
        case "Shift":
          this._handleShiftPress();
          break;
      }
    }, this._handleComponentKeyUp = (e) => {
      e.key === "Shift" && (this._treeContextState.isShiftPressed = !1);
    }, this._handleSlotChange = () => {
      this._treeContextState.itemListUpToDate = !1, O(this, this._assignedTreeItems), this.updateComplete.then(() => {
        if (this._treeContextState.activeItem === null) {
          const e = this.querySelector(":scope > vscode-tree-item");
          e && (e.active = !0);
        }
      });
    }, this.addEventListener("keyup", this._handleComponentKeyUp), this.addEventListener("keydown", this._handleComponentKeyDown);
  }
  connectedCallback() {
    super.connectedCallback(), this.role = "tree";
  }
  willUpdate(e) {
    this._updateConfigContext(e), e.has("multiSelect") && (this.ariaMultiSelectable = this.multiSelect ? "true" : "false");
  }
  //#endregion
  //#region public methods
  /**
   * Expands all folders.
   */
  expandAll() {
    this.querySelectorAll("vscode-tree-item").forEach((t) => {
      t.branch && (t.open = !0);
    });
  }
  /**
   * Collapses all folders.
   */
  collapseAll() {
    this.querySelectorAll("vscode-tree-item").forEach((t) => {
      t.branch && (t.open = !1);
    });
  }
  /**
   * @internal
   * Updates `hasBranchItem` property in the context state in order to removing
   * extra padding before the leaf elements, if it is required.
   */
  updateHasBranchItemFlag() {
    const e = this._assignedTreeItems.some((t) => t.branch);
    this._treeContextState = { ...this._treeContextState, hasBranchItem: e };
  }
  //#endregion
  //#region private methods
  _emitSelectEvent() {
    const e = new CustomEvent("vsc-tree-select", {
      detail: Array.from(this._treeContextState.selectedItems)
    });
    this.dispatchEvent(e);
  }
  _highlightIndentGuideOfItem(e) {
    if (e.branch && e.open)
      e.highlightedGuides = !0, this._treeContextState.highlightedItems?.add(e);
    else {
      const t = g(e);
      t && (t.highlightedGuides = !0, this._treeContextState.highlightedItems?.add(t));
    }
  }
  _highlightIndentGuides() {
    this.indentGuides !== M.none && (this._treeContextState.highlightedItems?.forEach((e) => e.highlightedGuides = !1), this._treeContextState.highlightedItems?.clear(), this._treeContextState.activeItem && this._highlightIndentGuideOfItem(this._treeContextState.activeItem), this._treeContextState.selectedItems.forEach((e) => {
      this._highlightIndentGuideOfItem(e);
    }));
  }
  _updateConfigContext(e) {
    const { hideArrows: t, expandMode: i, indent: n, indentGuides: o, multiSelect: r } = this;
    e.has("hideArrows") && (this._configContext = { ...this._configContext, hideArrows: t }), e.has("expandMode") && (this._configContext = { ...this._configContext, expandMode: i }), e.has("indent") && (this._configContext = { ...this._configContext, indent: n }), e.has("indentGuides") && (this._configContext = { ...this._configContext, indentGuides: o }), e.has("multiSelect") && (this._configContext = { ...this._configContext, multiSelect: r });
  }
  _focusItem(e) {
    e.active = !0, e.updateComplete.then(() => {
      e.focus(), this._highlightIndentGuides();
    });
  }
  _focusPrevItem() {
    if (this._treeContextState.focusedItem) {
      const e = R(this._treeContextState.focusedItem);
      e && (this._focusItem(e), this._treeContextState.isShiftPressed && this.multiSelect && (e.selected = !e.selected, this._emitSelectEvent()));
    }
  }
  _focusNextItem() {
    if (this._treeContextState.focusedItem) {
      const e = L(this._treeContextState.focusedItem);
      e && (this._focusItem(e), this._treeContextState.isShiftPressed && this.multiSelect && (e.selected = !e.selected, this._emitSelectEvent()));
    }
  }
  //#endregion
  //#region event handlers
  _handleArrowRightPress() {
    if (!this._treeContextState.focusedItem)
      return;
    const { focusedItem: e } = this._treeContextState;
    e.branch && (e.open ? this._focusNextItem() : e.open = !0);
  }
  _handleArrowLeftPress(e) {
    if (e.ctrlKey) {
      this.collapseAll();
      return;
    }
    if (!this._treeContextState.focusedItem)
      return;
    const { focusedItem: t } = this._treeContextState, i = g(t);
    t.branch ? t.open ? t.open = !1 : i && i.branch && this._focusItem(i) : i && i.branch && this._focusItem(i);
  }
  _handleArrowDownPress() {
    this._treeContextState.focusedItem ? this._focusNextItem() : this._focusItem(this._assignedTreeItems[0]);
  }
  _handleArrowUpPress() {
    this._treeContextState.focusedItem ? this._focusPrevItem() : this._focusItem(this._assignedTreeItems[0]);
  }
  _handleEnterPress() {
    const { focusedItem: e } = this._treeContextState;
    e && (this._treeContextState.selectedItems.forEach((t) => t.selected = !1), this._treeContextState.selectedItems.clear(), this._highlightIndentGuides(), e.selected = !0, this._emitSelectEvent(), e.branch && (e.open = !e.open));
  }
  _handleShiftPress() {
    this._treeContextState.isShiftPressed = !0;
  }
  //#endregion
  render() {
    return C`<div>
      <slot @slotchange=${this._handleSlotChange}></slot>
    </div>`;
  }
};
c.styles = A;
h([
  d({ type: String, attribute: "expand-mode" })
], c.prototype, "expandMode", void 0);
h([
  d({ type: Boolean, reflect: !0, attribute: "hide-arrows" })
], c.prototype, "hideArrows", void 0);
h([
  d({ type: Number, reflect: !0 })
], c.prototype, "indent", void 0);
h([
  d({
    type: String,
    attribute: "indent-guides",
    useDefault: !0,
    reflect: !0
  })
], c.prototype, "indentGuides", void 0);
h([
  d({ type: Boolean, reflect: !0, attribute: "multi-select" })
], c.prototype, "multiSelect", void 0);
h([
  m({ context: G })
], c.prototype, "_treeContextState", void 0);
h([
  m({ context: D })
], c.prototype, "_configContext", void 0);
h([
  y({ selector: "vscode-tree-item" })
], c.prototype, "_assignedTreeItems", void 0);
c = h([
  I("vscode-tree")
], c);
const K = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get VscodeTree() {
    return c;
  }
}, Symbol.toStringTag, { value: "Module" }));
export {
  F as E,
  M as I,
  K as a,
  D as c,
  O as i,
  y as o,
  E as s,
  G as t
};
