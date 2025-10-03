import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { IconSend } from "./icons";

import styles from "./button.styles";

type Variant = "default" | "secondary";

@customElement("ask-ai-button")
export class AskAIButton extends LitElement {
  @property({ type: String })
  inputValue = "";

  @property({ type: Boolean })
  isFocused = false;

  @property({ type: Boolean })
  readonly disabled = false;

  @property({ type: String })
  readonly placeholder = "Ask a question...";

  @property({ type: Boolean })
  readonly variant: Variant = "default";

  static readonly styles = [styles];

  render() {
    return html`
      <form @submit="${this.handleSubmit}">
        <fieldset part="fieldset">
          <input
            type="text"
            placeholder="${this.placeholder}"
            aria-label="${this.placeholder}"
            .value="${this.inputValue}"
            ?disabled="${this.disabled}"
            @input="${this.handleInput}"
            @focus="${this.handleFocus}"
            @blur="${this.handleBlur}"
            @keydown="${this.triggerSubmitOnEnter}"
          />

          <button
            type="submit"
            aria-label="Send message"
            ?disabled="${this.isButtonDisabled()}"
          >
            ${IconSend()}
          </button>
        </fieldset>
      </form>
    `;
  }

  private isButtonDisabled() {
    return !this.inputValue.trim() || this.disabled;
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.inputValue = target.value;
  }

  private handleFocus() {
    this.isFocused = true;
  }

  private handleBlur() {
    this.isFocused = false;
  }

  public triggerSubmitOnEnter(e: KeyboardEvent) {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (this.disabled || !this.inputValue.trim()) return;
    e.preventDefault();
    this.handleSubmit(e as unknown as Event);
  }

  private handleSubmit(e?: Event) {
    if (e) e.preventDefault();

    if (this.inputValue.trim() && !this.disabled) {
      // Dispatch custom event to parent component
      this.dispatchEvent(
        new CustomEvent("message-sent", {
          detail: { message: this.inputValue.trim() },
          bubbles: true,
          composed: true,
        })
      );

      // Clear input
      this.inputValue = "";
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ask-ai-button": AskAIButton;
  }
}
