import { r as f, d as m, i as v, V as y, b as g, a as b, n as o, c as _ } from "./default.styles-CXC3W7cl.js";
import { r as c } from "./state-Cw8Ci1Wr.js";
import { e as x } from "./query-CUjKX5wI.js";
import { o as r } from "./if-defined-BliwLxls.js";
function V() {
  return navigator.userAgent.indexOf("Linux") > -1 ? 'system-ui, "Ubuntu", "Droid Sans", sans-serif' : navigator.userAgent.indexOf("Mac") > -1 ? "-apple-system, BlinkMacSystemFont, sans-serif" : navigator.userAgent.indexOf("Windows") > -1 ? '"Segoe WPC", "Segoe UI", sans-serif' : "sans-serif";
}
const h = f(V()), k = [
  m,
  v`
    :host {
      display: inline-block;
      width: 320px;
    }

    .root {
      align-items: center;
      background-color: var(--vscode-settings-textInputBackground, #313131);
      border-color: var(
        --vscode-settings-textInputBorder,
        var(--vscode-settings-textInputBackground, #3c3c3c)
      );
      border-radius: 4px;
      border-style: solid;
      border-width: 1px;
      box-sizing: border-box;
      color: var(--vscode-settings-textInputForeground, #cccccc);
      display: flex;
      max-width: 100%;
      position: relative;
      width: 100%;
    }

    :host([focused]) .root {
      border-color: var(--vscode-focusBorder, #0078d4);
    }

    :host([invalid]),
    :host(:invalid) {
      border-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    :host([invalid]) input,
    :host(:invalid) input {
      background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    }

    ::slotted([slot='content-before']) {
      display: block;
      margin-left: 2px;
    }

    ::slotted([slot='content-after']) {
      display: block;
      margin-right: 2px;
    }

    slot[name='content-before'],
    slot[name='content-after'] {
      align-items: center;
      display: flex;
    }

    input {
      background-color: var(--vscode-settings-textInputBackground, #313131);
      border: 0;
      box-sizing: border-box;
      color: var(--vscode-settings-textInputForeground, #cccccc);
      display: block;
      font-family: var(--vscode-font-family, ${h});
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, 'normal');
      line-height: 18px;
      outline: none;
      padding-bottom: 3px;
      padding-left: 4px;
      padding-right: 4px;
      padding-top: 3px;
      width: 100%;
    }

    input:read-only:not([type='file']) {
      cursor: not-allowed;
    }

    input::placeholder {
      color: var(--vscode-input-placeholderForeground, #989898);
      opacity: 1;
    }

    input[type='file'] {
      line-height: 24px;
      padding-bottom: 0;
      padding-left: 2px;
      padding-top: 0;
    }

    input[type='file']::file-selector-button {
      background-color: var(--vscode-button-background, #0078d4);
      border: 0;
      border-radius: 2px;
      color: var(--vscode-button-foreground, #ffffff);
      cursor: pointer;
      font-family: var(--vscode-font-family, ${h});
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, 'normal');
      line-height: 20px;
      padding: 0 14px;
    }

    input[type='file']::file-selector-button:hover {
      background-color: var(--vscode-button-hoverBackground, #026ec1);
    }
  `
];
var i = function(d, e, n, a) {
  var l = arguments.length, s = l < 3 ? e : a === null ? a = Object.getOwnPropertyDescriptor(e, n) : a, u;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") s = Reflect.decorate(d, e, n, a);
  else for (var p = d.length - 1; p >= 0; p--) (u = d[p]) && (s = (l < 3 ? u(s) : l > 3 ? u(e, n, s) : u(e, n)) || s);
  return l > 3 && s && Object.defineProperty(e, n, s), s;
};
let t = class extends y {
  /**
   * Same as the `type` of the native `<input>` element but only a subset of types are supported.
   * The supported ones are: `color`,`date`,`datetime-local`,`email`,`file`,`month`,`number`,`password`,`search`,`tel`,`text`,`time`,`url`,`week`
   */
  set type(e) {
    const n = [
      "color",
      "date",
      "datetime-local",
      "email",
      "file",
      "month",
      "number",
      "password",
      "search",
      "tel",
      "text",
      "time",
      "url",
      "week"
    ];
    this._type = n.includes(e) ? e : "text";
  }
  get type() {
    return this._type;
  }
  set value(e) {
    this.type !== "file" && (this._value = e, this._internals.setFormValue(e)), this.updateComplete.then(() => {
      this._setValidityFromInput();
    });
  }
  get value() {
    return this._value;
  }
  /**
   * Lowercase alias to minLength
   */
  set minlength(e) {
    this.minLength = e;
  }
  get minlength() {
    return this.minLength;
  }
  /**
   * Lowercase alias to maxLength
   */
  set maxlength(e) {
    this.maxLength = e;
  }
  get maxlength() {
    return this.maxLength;
  }
  get form() {
    return this._internals.form;
  }
  get validity() {
    return this._internals.validity;
  }
  get validationMessage() {
    return this._internals.validationMessage;
  }
  get willValidate() {
    return this._internals.willValidate;
  }
  /**
   * Check the component's validity state when built-in validation is used.
   * Built-in validation is triggered when any validation-related attribute is set. Validation-related
   * attributes are: `max, maxlength, min, minlength, pattern, required, step`.
   * See this [the MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/checkValidity) for more details.
   * @returns {boolean}
   */
  checkValidity() {
    return this._setValidityFromInput(), this._internals.checkValidity();
  }
  reportValidity() {
    return this._setValidityFromInput(), this._internals.reportValidity();
  }
  get wrappedElement() {
    return this._inputEl;
  }
  constructor() {
    super(), this.autocomplete = void 0, this.autofocus = !1, this.defaultValue = "", this.disabled = !1, this.focused = !1, this.invalid = !1, this.label = "", this.max = void 0, this.maxLength = void 0, this.min = void 0, this.minLength = void 0, this.multiple = !1, this.name = void 0, this.pattern = void 0, this.placeholder = void 0, this.readonly = !1, this.required = !1, this.step = void 0, this._value = "", this._type = "text", this._internals = this.attachInternals();
  }
  connectedCallback() {
    super.connectedCallback(), this.updateComplete.then(() => {
      this._inputEl.checkValidity(), this._setValidityFromInput(), this._internals.setFormValue(this._inputEl.value);
    });
  }
  attributeChangedCallback(e, n, a) {
    super.attributeChangedCallback(e, n, a), [
      "max",
      "maxlength",
      "min",
      "minlength",
      "pattern",
      "required",
      "step"
    ].includes(e) && this.updateComplete.then(() => {
      this._setValidityFromInput();
    });
  }
  /** @internal */
  formResetCallback() {
    this.value = this.defaultValue, this.requestUpdate();
  }
  /** @internal */
  formStateRestoreCallback(e, n) {
    this.value = e;
  }
  _dataChanged() {
    if (this._value = this._inputEl.value, this.type === "file" && this._inputEl.files)
      for (const e of this._inputEl.files)
        this._internals.setFormValue(e);
    else
      this._internals.setFormValue(this._inputEl.value);
  }
  _setValidityFromInput() {
    this._inputEl && this._internals.setValidity(this._inputEl.validity, this._inputEl.validationMessage, this._inputEl);
  }
  _onInput() {
    this._dataChanged(), this._setValidityFromInput();
  }
  _onChange() {
    this._dataChanged(), this._setValidityFromInput(), this.dispatchEvent(new Event("change"));
  }
  _onFocus() {
    this.focused = !0;
  }
  _onBlur() {
    this.focused = !1;
  }
  _onKeyDown(e) {
    e.key === "Enter" && this._internals.form && this._internals.form?.requestSubmit();
  }
  render() {
    return g`
      <div class="root">
        <slot name="content-before"></slot>
        <input
          id="input"
          type=${this.type}
          ?autofocus=${this.autofocus}
          autocomplete=${r(this.autocomplete)}
          aria-label=${this.label}
          ?disabled=${this.disabled}
          max=${r(this.max)}
          maxlength=${r(this.maxLength)}
          min=${r(this.min)}
          minlength=${r(this.minLength)}
          ?multiple=${this.multiple}
          name=${r(this.name)}
          pattern=${r(this.pattern)}
          placeholder=${r(this.placeholder)}
          ?readonly=${this.readonly}
          ?required=${this.required}
          step=${r(this.step)}
          .value=${this._value}
          @blur=${this._onBlur}
          @change=${this._onChange}
          @focus=${this._onFocus}
          @input=${this._onInput}
          @keydown=${this._onKeyDown}
        />
        <slot name="content-after"></slot>
      </div>
    `;
  }
};
t.styles = k;
t.formAssociated = !0;
t.shadowRootOptions = {
  ...b.shadowRootOptions,
  delegatesFocus: !0
};
i([
  o()
], t.prototype, "autocomplete", void 0);
i([
  o({ type: Boolean, reflect: !0 })
], t.prototype, "autofocus", void 0);
i([
  o({ attribute: "default-value" })
], t.prototype, "defaultValue", void 0);
i([
  o({ type: Boolean, reflect: !0 })
], t.prototype, "disabled", void 0);
i([
  o({ type: Boolean, reflect: !0 })
], t.prototype, "focused", void 0);
i([
  o({ type: Boolean, reflect: !0 })
], t.prototype, "invalid", void 0);
i([
  o({ attribute: !1 })
], t.prototype, "label", void 0);
i([
  o({ type: Number })
], t.prototype, "max", void 0);
i([
  o({ type: Number })
], t.prototype, "maxLength", void 0);
i([
  o({ type: Number })
], t.prototype, "min", void 0);
i([
  o({ type: Number })
], t.prototype, "minLength", void 0);
i([
  o({ type: Boolean, reflect: !0 })
], t.prototype, "multiple", void 0);
i([
  o({ reflect: !0 })
], t.prototype, "name", void 0);
i([
  o()
], t.prototype, "pattern", void 0);
i([
  o()
], t.prototype, "placeholder", void 0);
i([
  o({ type: Boolean, reflect: !0 })
], t.prototype, "readonly", void 0);
i([
  o({ type: Boolean, reflect: !0 })
], t.prototype, "required", void 0);
i([
  o({ type: Number })
], t.prototype, "step", void 0);
i([
  o({ reflect: !0 })
], t.prototype, "type", null);
i([
  o()
], t.prototype, "value", null);
i([
  x("#input")
], t.prototype, "_inputEl", void 0);
i([
  c()
], t.prototype, "_value", void 0);
i([
  c()
], t.prototype, "_type", void 0);
t = i([
  _("vscode-textfield")
], t);
export {
  t as VscodeTextfield
};
