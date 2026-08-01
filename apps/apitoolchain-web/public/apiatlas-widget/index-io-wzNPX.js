import { d as D, i as k, V as F, A as _, b as d, n as c, c as $ } from "./default.styles-CXC3W7cl.js";
import { s as B, i as P, E as m, I as g, o as f, t as L, c as V } from "./index-DEzvgSqM.js";
import { r as p } from "./state-Cw8Ci1Wr.js";
import { e as u, s as S } from "./style-property-map-BhmBXb06.js";
class b {
  constructor(t, e, s, i) {
    if (this.subscribe = !1, this.provided = !1, this.value = void 0, this.t = (o, l) => {
      this.unsubscribe && (this.unsubscribe !== l && (this.provided = !1, this.unsubscribe()), this.subscribe || this.unsubscribe()), this.value = o, this.host.requestUpdate(), this.provided && !this.subscribe || (this.provided = !0, this.callback && this.callback(o, l)), this.unsubscribe = l;
    }, this.host = t, e.context !== void 0) {
      const o = e;
      this.context = o.context, this.callback = o.callback, this.subscribe = o.subscribe ?? !1;
    } else this.context = e, this.callback = s, this.subscribe = i ?? !1;
    this.host.addController(this);
  }
  hostConnected() {
    this.dispatchRequest();
  }
  hostDisconnected() {
    this.unsubscribe && (this.unsubscribe(), this.unsubscribe = void 0);
  }
  dispatchRequest() {
    this.host.dispatchEvent(new B(this.context, this.host, this.t, this.subscribe));
  }
}
function C({ context: r, subscribe: t }) {
  return (e, s) => {
    typeof s == "object" ? s.addInitializer((function() {
      new b(this, { context: r, callback: (i) => {
        e.set.call(this, i);
      }, subscribe: t });
    })) : e.constructor.addInitializer(((i) => {
      new b(i, { context: r, callback: (o) => {
        i[s] = o;
      }, subscribe: t });
    }));
  };
}
const O = [
  D,
  k`
    :host {
      --hover-outline-color: transparent;
      --hover-outline-style: solid;
      --hover-outline-width: 0;

      --selected-outline-color: transparent;
      --selected-outline-style: solid;
      --selected-outline-width: 0;

      cursor: pointer;
      display: block;
      user-select: none;
    }

    ::slotted(vscode-icon) {
      display: block;
    }

    .root {
      display: block;
    }

    .wrapper {
      align-items: flex-start;
      color: var(--vscode-foreground, #cccccc);
      display: flex;
      flex-wrap: nowrap;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 22px;
      min-height: 22px;
      outline-offset: -1px;
      padding-right: 12px;
    }

    .wrapper:hover {
      background-color: var(--vscode-list-hoverBackground, #2a2d2e);
      color: var(
        --vscode-list-hoverForeground,
        var(--vscode-foreground, #cccccc)
      );
    }

    :host([selected]) .wrapper {
      color: var(--internal-selectionForeground);
      background-color: var(--internal-selectionBackground);
    }

    :host([selected]) ::slotted(vscode-icon) {
      color: var(--internal-selectionForeground);
    }

    :host(:focus) {
      outline: none;
    }

    :host(:focus) .wrapper.active {
      outline-color: var(
        --vscode-list-focusAndSelectionOutline,
        var(--vscode-list-focusOutline, #0078d4)
      );
      outline-style: solid;
      outline-width: 1px;
    }

    .arrow-container {
      align-items: center;
      display: var(--vsc-tree-item-arrow-display);
      height: 22px;
      justify-content: center;
      padding-left: 8px;
      padding-right: 6px;
      width: 16px;
    }

    .arrow-container svg {
      display: block;
      fill: var(--vscode-icon-foreground, #cccccc);
    }

    .arrow-container.icon-rotated svg {
      transform: rotate(90deg);
    }

    :host([selected]) .arrow-container svg {
      fill: var(--internal-selectionIconForeground);
    }

    .icon-container {
      align-items: center;
      display: flex;
      justify-content: center;
      margin-right: 3px;
      min-height: 22px;
      overflow: hidden;
    }

    .icon-container slot {
      display: block;
    }

    .icon-container.has-icon {
      min-width: 22px;
      max-width: 22px;
      max-height: 22px;
    }

    :host(:is(:--show-actions, :state(show-actions))) .icon-container {
      overflow: visible;
    }

    .children {
      position: relative;
    }

    .children.guide:before {
      background-color: var(
        --vscode-tree-inactiveIndentGuidesStroke,
        rgba(88, 88, 88, 0.4)
      );
      content: '';
      display: none;
      height: 100%;
      left: var(--indentation-guide-left);
      pointer-events: none;
      position: absolute;
      width: 1px;
      z-index: 1;
    }

    .children.guide.default-guide:before {
      display: var(--internal-defaultIndentGuideDisplay);
    }

    .children.guide.highlighted-guide:before {
      display: var(--internal-highlightedIndentGuideDisplay);
      background-color: var(--vscode-tree-indentGuidesStroke, #585858);
    }

    .content {
      display: flex;
      align-items: center;
      flex-wrap: nowrap; /* prevent wrapping; allow ellipses via min-width: 0 */
      min-width: 0;
      width: 100%;
      line-height: 22px;
    }

    .label {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex: 0 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .description {
      color: var(--vscode-foreground, #cccccc);
      opacity: 0.7;
      display: none;
      flex: 0 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .content.has-description .description {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex: 1 1 0%; /* description takes remaining space, yields first when shrinking */
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-left: 0.5em;
    }

    .content.has-description .label {
      flex: 0 1 auto; /* label only grows when description missing */
    }

    .content:not(.has-description) .label {
      flex: 1 1 auto;
    }

    .label ::slotted(*) {
      display: inline-block;
      max-width: 100%;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .description ::slotted(*) {
      display: inline-block;
      max-width: 100%;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      align-items: center;
      align-self: center;
      display: none;
      flex: 0 0 auto;
      gap: 2px;
      margin-left: auto;
      min-height: 22px;
      color: inherit;
    }

    .actions ::slotted(*) {
      align-items: center;
      display: inline-flex;
      height: 22px;
    }

    .actions ::slotted(button) {
      cursor: pointer;
    }

    .actions ::slotted([hidden]) {
      display: none !important;
    }

    :host(
        :is(
          :--has-actions:--show-actions,
          :--has-actions:state(show-actions),
          :state(has-actions):--show-actions,
          :state(has-actions):state(show-actions)
        )
      )
      .actions {
      display: inline-flex;
    }

    .decoration {
      align-items: center;
      align-self: center;
      color: inherit;
      display: none;
      flex: 0 0 auto;
      gap: 4px;
      margin-left: auto;
      min-height: 22px;
    }

    :host(:is(:--has-decoration, :state(has-decoration))) .decoration {
      display: inline-flex;
    }

    :host(:is(:--show-actions, :state(show-actions))) .decoration {
      margin-left: 6px;
    }

    :host([selected]) ::slotted([slot='decoration']),
    :host([selected]) ::slotted([slot='decoration']) * {
      color: inherit !important;
    }

    :host([selected]) .description {
      color: var(--internal-selectionForeground, #ffffff);
      opacity: 0.8;
    }

    :host([selected]) :is(:state(focus-visible), :--focus-visible) .description,
    :host([selected]:focus-within) .description {
      opacity: 0.95;
    }

    :host([branch]) ::slotted(vscode-tree-item) {
      display: none;
    }

    :host([branch][open]) ::slotted(vscode-tree-item) {
      display: block;
    }
  `
];
var a = function(r, t, e, s) {
  var i = arguments.length, o = i < 3 ? t : s === null ? s = Object.getOwnPropertyDescriptor(t, e) : s, l;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") o = Reflect.decorate(r, t, e, s);
  else for (var h = r.length - 1; h >= 0; h--) (l = r[h]) && (o = (i < 3 ? l(o) : i > 3 ? l(t, e, o) : l(t, e)) || o);
  return i > 3 && o && Object.defineProperty(t, e, o), o;
}, v;
const x = 3, T = 30, H = d`<svg
  width="16"
  height="16"
  viewBox="0 0 16 16"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"
  />
</svg>`;
function R(r) {
  return !r.parentElement || !(r.parentElement instanceof n) ? null : r.parentElement;
}
let n = v = class extends F {
  set selected(t) {
    this._selected = t, t ? this._treeContextState.selectedItems.add(this) : this._treeContextState.selectedItems.delete(this), this.ariaSelected = t ? "true" : "false", this._updateActionsVisibility();
  }
  get selected() {
    return this._selected;
  }
  set path(t) {
    this._path = t;
  }
  get path() {
    return this._path;
  }
  //#endregion
  //#region lifecycle methods
  constructor() {
    super(), this.active = !1, this.branch = !1, this.hasActiveItem = !1, this.hasSelectedItem = !1, this.highlightedGuides = !1, this.open = !1, this.level = 0, this._selected = !1, this._path = [], this._hasBranchIcon = !1, this._hasBranchOpenedIcon = !1, this._hasLeafIcon = !1, this._hasDescriptionSlotContent = !1, this._hasActionsSlotContent = !1, this._hasDecorationSlotContent = !1, this._treeContextState = {
      isShiftPressed: !1,
      selectedItems: /* @__PURE__ */ new Set(),
      hoveredItem: null,
      allItems: null,
      itemListUpToDate: !1,
      focusedItem: null,
      prevFocusedItem: null,
      hasBranchItem: !1,
      rootElement: null,
      activeItem: null
    }, this._isPointerInside = !1, this._hasKeyboardFocus = !1, this._handleMainSlotChange = () => {
      this._mainSlotChange(), this._treeContextState.itemListUpToDate = !1;
    }, this._handleComponentFocus = () => {
      this._treeContextState.focusedItem && this._treeContextState.focusedItem !== this && (this._treeContextState.isShiftPressed || (this._treeContextState.prevFocusedItem = this._treeContextState.focusedItem), this._treeContextState.focusedItem = null), this._treeContextState.focusedItem = this;
    }, this._handlePointerEnter = () => {
      this._isPointerInside = !0, this._claimHover();
    }, this._handlePointerLeave = (t) => {
      this._isPointerInside = !1, this._treeContextState.hoveredItem === this && (this._treeContextState.hoveredItem = null), this._clearHoverState();
      const e = t.relatedTarget;
      if (e instanceof Element) {
        const s = e.closest("vscode-tree-item");
        s && s !== this && s.isConnected && s._adoptHoverFromSibling();
      }
    }, this._handleFocusIn = () => {
      this._updateFocusState();
    }, this._handleFocusOut = () => {
      this._updateFocusState();
    }, this._internals = this.attachInternals(), this.addEventListener("focus", this._handleComponentFocus), this.addEventListener("pointerenter", this._handlePointerEnter), this.addEventListener("pointerleave", this._handlePointerLeave), this.addEventListener("focusin", this._handleFocusIn), this.addEventListener("focusout", this._handleFocusOut);
  }
  connectedCallback() {
    super.connectedCallback(), this._mainSlotChange(), this.role = "treeitem", this.ariaDisabled = "false";
  }
  firstUpdated(t) {
    super.firstUpdated(t), this._refreshDescriptionSlotState(), this._refreshActionsSlotState(), this._refreshDecorationSlotState(), this.matches(":hover") ? (this._isPointerInside = !0, this._claimHover()) : this._updateActionsVisibility();
  }
  willUpdate(t) {
    t.has("active") && this._toggleActiveState(), (t.has("open") || t.has("branch")) && this._setAriaExpanded();
  }
  //#endregion
  //#region private methods
  _setAriaExpanded() {
    this.branch ? this.ariaExpanded = this.open ? "true" : "false" : this.ariaExpanded = null;
  }
  _setHasActiveItemFlagOnParent(t, e) {
    const s = R(t);
    s && (s.hasActiveItem = e);
  }
  _refreshDescriptionSlotState() {
    const t = (this._descriptionSlotElements?.length ?? 0) > 0;
    this._hasDescriptionSlotContent = t, this._setCustomState("has-description", t);
  }
  _refreshActionsSlotState() {
    const t = (this._actionsSlotElements?.length ?? 0) > 0;
    this._hasActionsSlotContent = t, this._setCustomState("has-actions", t), this._updateActionsVisibility();
  }
  _refreshDecorationSlotState() {
    const t = (this._decorationSlotElements?.length ?? 0) > 0, e = this._hasDecorationSlotContent;
    this._hasDecorationSlotContent = t, this._setCustomState("has-decoration", t), e !== t && this.requestUpdate();
  }
  _setCustomState(t, e) {
    if (this._internals?.states)
      try {
        e ? this._internals.states.add(t) : this._internals.states.delete(t);
      } catch {
        e ? this._internals.states.add(`--${t}`) : this._internals.states.delete(`--${t}`);
      }
  }
  _getActiveElement() {
    const t = this.getRootNode({ composed: !0 });
    return (t instanceof Document || t instanceof ShadowRoot) && t.activeElement instanceof Element ? t.activeElement : null;
  }
  _isActiveElementInActions(t) {
    return t ? (this._actionsSlotElements ?? []).some((e) => e === t || e.contains(t)) : !1;
  }
  _updateActionsVisibility() {
    if (!this._hasActionsSlotContent) {
      this._setCustomState("show-actions", !1);
      return;
    }
    const t = this._getActiveElement(), e = this._isActiveElementInActions(t), s = this.selected || this._isPointerInside || this._hasKeyboardFocus || e;
    this._setCustomState("show-actions", s);
  }
  _updateFocusState() {
    const t = this.matches(":focus-visible");
    this._setCustomState("focus-visible", t);
    const e = this._getActiveElement();
    let s = null;
    if (e instanceof Element && (s = e.closest("vscode-tree-item"), !s)) {
      const o = e.getRootNode();
      o instanceof ShadowRoot && o.host instanceof v && (s = o.host);
    }
    const i = s === this;
    this._hasKeyboardFocus = i, this._setCustomState("keyboard-focus", i), this._updateActionsVisibility();
  }
  _clearHoverState() {
    this._isPointerInside = !1, this._setCustomState("hover", !1), this._updateActionsVisibility();
  }
  _adoptHoverFromSibling() {
    this._isPointerInside = !0, this._claimHover();
  }
  _claimHover() {
    const t = this._treeContextState;
    t.hoveredItem && t.hoveredItem !== this && t.hoveredItem._clearHoverState(), t.hoveredItem = this, this._setCustomState("hover", !0), this._updateActionsVisibility();
  }
  _toggleActiveState() {
    this.active ? (this._treeContextState.activeItem && (this._treeContextState.activeItem.active = !1, this._setHasActiveItemFlagOnParent(this._treeContextState.activeItem, !1)), this._treeContextState.activeItem = this, this._setHasActiveItemFlagOnParent(this, !0), this.tabIndex = 0, this._setCustomState("active", !0)) : (this._treeContextState.activeItem === this && (this._treeContextState.activeItem = null, this._setHasActiveItemFlagOnParent(this, !1)), this.tabIndex = -1, this._setCustomState("active", !1));
  }
  _selectItem(t) {
    const { selectedItems: e } = this._treeContextState, { multiSelect: s } = this._configContext, i = new Set(e);
    s && t ? this.selected = !this.selected : (Array.from(e).forEach((l) => {
      l !== this && (l.selected = !1);
    }), e.clear(), this.selected = !0);
    const o = /* @__PURE__ */ new Set([
      ...i,
      ...e
    ]);
    o.add(this), o.forEach((l) => l._updateActionsVisibility());
  }
  _selectRange() {
    const t = this._treeContextState.prevFocusedItem;
    if (!t || t === this)
      return;
    const e = new Set(this._treeContextState.selectedItems);
    this._treeContextState.itemListUpToDate || (this._treeContextState.allItems = this._treeContextState.rootElement.querySelectorAll("vscode-tree-item"), this._treeContextState.allItems && this._treeContextState.allItems.forEach((l, h) => {
      l.dataset.score = h.toString();
    }), this._treeContextState.itemListUpToDate = !0);
    let s = +(t.dataset.score ?? -1), i = +(this.dataset.score ?? -1);
    s > i && ([s, i] = [i, s]), Array.from(this._treeContextState.selectedItems).forEach((l) => l.selected = !1), this._treeContextState.selectedItems.clear(), this._selectItemsAndAllVisibleDescendants(s, i);
    const o = /* @__PURE__ */ new Set([
      ...e,
      ...this._treeContextState.selectedItems
    ]);
    o.add(this), o.forEach((l) => l._updateActionsVisibility());
  }
  _selectItemsAndAllVisibleDescendants(t, e) {
    let s = t;
    for (; s <= e; )
      if (this._treeContextState.allItems) {
        const i = this._treeContextState.allItems[s];
        if (i.branch && !i.open) {
          i.selected = !0;
          const o = i.querySelectorAll("vscode-tree-item").length;
          s += o;
        } else i.branch && i.open ? (i.selected = !0, s += this._selectItemsAndAllVisibleDescendants(s + 1, e)) : (i.selected = !0, s += 1);
      }
    return s;
  }
  _mainSlotChange() {
    this._initiallyAssignedTreeItems.forEach((t) => {
      t.setAttribute("slot", "children");
    });
  }
  //#endregion
  //#region event handlers
  _handleChildrenSlotChange() {
    P(this, this._childrenTreeItems), this._treeContextState.rootElement && this._treeContextState.rootElement.updateHasBranchItemFlag();
  }
  _handleDescriptionSlotChange() {
    this._refreshDescriptionSlotState();
  }
  _handleActionsSlotChange() {
    this._refreshActionsSlotState();
  }
  _handleDecorationSlotChange() {
    this._refreshDecorationSlotState();
  }
  _handleContentClick(t) {
    t.stopPropagation();
    const e = t.ctrlKey || t.metaKey, s = t.shiftKey;
    s && this._configContext.multiSelect ? (this._selectRange(), this._treeContextState.emitSelectEvent?.(), this.updateComplete.then(() => {
      this._treeContextState.highlightIndentGuides?.();
    })) : (this._selectItem(e), this._treeContextState.emitSelectEvent?.(), this.updateComplete.then(() => {
      this._treeContextState.highlightIndentGuides?.();
    }), this._configContext.expandMode === m.singleClick && this.branch && !(this._configContext.multiSelect && e) && (this.open = !this.open)), this.active = !0, s || (this._treeContextState.prevFocusedItem = this);
  }
  _handleDoubleClick(t) {
    this._configContext.expandMode === m.doubleClick && this.branch && !(this._configContext.multiSelect && (t.ctrlKey || t.metaKey)) && (this.open = !this.open);
  }
  _handleIconSlotChange(t) {
    const e = t.target, s = e.assignedElements().length > 0;
    switch (e.name) {
      case "icon-branch":
        this._hasBranchIcon = s;
        break;
      case "icon-branch-opened":
        this._hasBranchOpenedIcon = s;
        break;
      case "icon-leaf":
        this._hasLeafIcon = s;
        break;
    }
  }
  //#endregion
  render() {
    const { hideArrows: t, indent: e, indentGuides: s } = this._configContext, { hasBranchItem: i } = this._treeContextState;
    let o = x + this.level * e;
    const l = t ? 3 : 13, h = x + this.level * e + l;
    !this.branch && !t && i && (o += T);
    const I = this._hasBranchIcon && this.branch || this._hasBranchOpenedIcon && this.branch && this.open || this._hasLeafIcon && !this.branch, y = {
      wrapper: !0,
      active: this.active,
      "has-description": this._hasDescriptionSlotContent,
      "has-actions": this._hasActionsSlotContent,
      "has-decoration": this._hasDecorationSlotContent
    }, w = {
      children: !0,
      guide: s !== g.none,
      "default-guide": s !== g.none,
      "highlighted-guide": this.highlightedGuides
    }, A = {
      "icon-container": !0,
      "has-icon": I
    }, E = {
      content: !0,
      "has-description": this._hasDescriptionSlotContent,
      "has-decoration": this._hasDecorationSlotContent
    };
    return d` <div class="root">
      <div
        class=${u(y)}
        part="wrapper"
        @click=${this._handleContentClick}
        @dblclick=${this._handleDoubleClick}
        .style=${S({ paddingLeft: `${o}px` })}
      >
        ${this.branch && !t ? d`<div
              class=${u({
      "arrow-container": !0,
      "icon-rotated": this.open
    })}
              part="arrow-icon-container"
            >
              ${H}
            </div>` : _}
        <div class=${u(A)} part="icon-container">
          ${this.branch && !this.open ? d`<slot
                name="icon-branch"
                @slotchange=${this._handleIconSlotChange}
              ></slot>` : _}
          ${this.branch && this.open ? d`<slot
                name="icon-branch-opened"
                @slotchange=${this._handleIconSlotChange}
              ></slot>` : _}
          ${this.branch ? _ : d`<slot
                name="icon-leaf"
                @slotchange=${this._handleIconSlotChange}
              ></slot>`}
        </div>
        <div class=${u(E)} part="content">
          <span class="label" part="label">
            <slot @slotchange=${this._handleMainSlotChange}></slot>
          </span>
          <span
            class="description"
            part="description"
            ?hidden=${!this._hasDescriptionSlotContent}
          >
            <slot
              name="description"
              @slotchange=${this._handleDescriptionSlotChange}
            ></slot>
          </span>
          <div class="actions" part="actions">
            <slot
              name="actions"
              @slotchange=${this._handleActionsSlotChange}
            ></slot>
          </div>
          <div class="decoration" part="decoration">
            <slot
              name="decoration"
              @slotchange=${this._handleDecorationSlotChange}
            ></slot>
          </div>
        </div>
      </div>
      <div
        class=${u(w)}
        .style=${S({
      "--indentation-guide-left": `${h}px`
    })}
        role="group"
        part="children"
      >
        <slot
          name="children"
          @slotchange=${this._handleChildrenSlotChange}
        ></slot>
      </div>
    </div>`;
  }
};
n.styles = O;
a([
  c({ type: Boolean })
], n.prototype, "active", void 0);
a([
  c({ type: Boolean, reflect: !0 })
], n.prototype, "branch", void 0);
a([
  c({ type: Boolean })
], n.prototype, "hasActiveItem", void 0);
a([
  c({ type: Boolean })
], n.prototype, "hasSelectedItem", void 0);
a([
  c({ type: Boolean })
], n.prototype, "highlightedGuides", void 0);
a([
  c({ type: Boolean, reflect: !0 })
], n.prototype, "open", void 0);
a([
  c({ type: Number, reflect: !0 })
], n.prototype, "level", void 0);
a([
  c({ type: Boolean, reflect: !0 })
], n.prototype, "selected", null);
a([
  p()
], n.prototype, "_hasBranchIcon", void 0);
a([
  p()
], n.prototype, "_hasBranchOpenedIcon", void 0);
a([
  p()
], n.prototype, "_hasLeafIcon", void 0);
a([
  p()
], n.prototype, "_hasDescriptionSlotContent", void 0);
a([
  p()
], n.prototype, "_hasActionsSlotContent", void 0);
a([
  p()
], n.prototype, "_hasDecorationSlotContent", void 0);
a([
  C({ context: L, subscribe: !0 })
], n.prototype, "_treeContextState", void 0);
a([
  C({ context: V, subscribe: !0 })
], n.prototype, "_configContext", void 0);
a([
  f({ selector: "vscode-tree-item" })
], n.prototype, "_initiallyAssignedTreeItems", void 0);
a([
  f({ selector: "vscode-tree-item", slot: "children" })
], n.prototype, "_childrenTreeItems", void 0);
a([
  f({ slot: "description", flatten: !0 })
], n.prototype, "_descriptionSlotElements", void 0);
a([
  f({ slot: "actions", flatten: !0 })
], n.prototype, "_actionsSlotElements", void 0);
a([
  f({ slot: "decoration", flatten: !0 })
], n.prototype, "_decorationSlotElements", void 0);
n = v = a([
  $("vscode-tree-item")
], n);
export {
  n as VscodeTreeItem
};
