import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import styles from "./button-icon.css";

type Variant = "default" | "compact" | "header";

@customElement("ask-ai-button-icon")
export class AskAIButtonIcon extends LitElement {
  @property({ type: String })
  title = "";

  @property({ type: String })
  ariaLabel = "";

  @property({ type: String })
  icon = "";

  @property({ type: Boolean })
  disabled = false;

  @property({ type: String })
  variant: Variant = "default";

  static styles = [unsafeCSS(styles)];

  render() {
    return html`
      <button
        ?disabled="${this.disabled}"
        title="${this.title}"
        aria-label="${this.ariaLabel}"
        type="button"
        @click="${this.handleClick}"
      >
        <slot> ${this.icon ? this.renderIcon() : ""} </slot>
      </button>
    `;
  }

  private renderIcon() {
    // This is a fallback for when icon is provided as a string
    // In practice, you'd use the slot for SVG content
    return html`<span data-icon="placeholder">${this.icon}</span>`;
  }

  private handleClick(event: Event) {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.dispatchEvent(
      new CustomEvent("button-click", {
        bubbles: true,
        composed: true,
        detail: {
          title: this.title,
          ariaLabel: this.ariaLabel,
        },
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ask-ai-button-icon": AskAIButtonIcon;
  }
}
