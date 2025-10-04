import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import "./button";
import "./button-icon";
import "./message";
import "./drawer";

import styles from "./index.styles";

@customElement("ask-ai")
export class AskAI extends LitElement {
  @property({ type: String })
  placeholder = "Ask a question...";

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  drawerOpen = false;

  @query("ask-ai-drawer")
  private drawerEl!: HTMLElement & {
    scrollToBottom: (options?: ScrollToOptions) => void;
  };

  static styles = [styles];

  // connectedCallback() {
  //   super.connectedCallback()
    
  //   this.style.cssText += `
  //   padding: 0 16px 24px 0;
  // `;
  // }
  render() {
    return html`
      ${this.welcomeButton()}

      <ask-ai-drawer
        ?open="${this.drawerOpen}"
        @drawer-close="${this.handleDrawerClose}"
      >
        <span slot="title">
          <span aria-hidden="true">✨</span>
          Assistant
        </span>

        <div slot="messages">
          <slot @slotchange="${this.handleSlotchange}"></slot>
          <footer>
            <ask-ai-button
              variant="secondary"
              .placeholder="${this.placeholder}"
              .disabled="${this.disabled}"
              @message-sent="${this.handleMessageSent}"
            ></ask-ai-button>
          </footer>
        </div>
      </ask-ai-drawer>
    `;
  }

  private handleSlotchange(_e: Event) {
    if (!this.drawerOpen || !this.drawerEl) return;
    this.drawerEl.scrollToBottom({ behavior: "smooth" });
  }

  private welcomeButton() {
    if (this.drawerOpen) {
      return html``;
    }

    return html`
      <ask-ai-button
        .placeholder="${this.placeholder}"
        .disabled="${this.disabled}"
        @message-sent="${this.handleMessageSent}"
      ></ask-ai-button>
    `;
  }

  private handleMessageSent(e: CustomEvent) {
    const message = e.detail.message;
    this.drawerOpen = true;

    // Dispatch submit event for React to handle via @lit/react events mapping
    this.dispatchEvent(
      new CustomEvent("submit", {
        detail: { message },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleDrawerClose() {
    this.drawerOpen = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ask-ai": AskAI;
  }
}
