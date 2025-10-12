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

  private get isMac() {
    return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.handleGlobalKeydown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.handleGlobalKeydown);
  }

  private handleGlobalKeydown = (e: KeyboardEvent) => {
    // Check for Cmd+I (Mac) or Ctrl+I (Windows/Linux)
    const isCorrectKey = e.key === "i" || e.key === "I";
    const isCorrectModifier = this.isMac ? e.metaKey : e.ctrlKey;

    if (isCorrectKey && isCorrectModifier && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      this.toggleDrawer();
    }
  };

  private toggleDrawer() {
    this.drawerOpen = !this.drawerOpen;
  }

  render() {
    return html`
      ${this.welcomeButton()}

      <ask-ai-drawer
        ?open="${this.drawerOpen}"
        @drawer-close="${this.handleDrawerClose}"
      >
        <slot slot="title" name="title"></slot>
        <!-- <span slot="title">
          <span aria-hidden="true">✨</span>
          Assistant
        </span> -->

        <div slot="messages">
          <slot @slotchange="${this.handleSlotchange}"></slot>
          <footer>
            <ask-ai-button
              variant="secondary"
              .placeholder="${this.placeholder}"
              .disabled="${this.disabled}"
              .showKeyboardShortcut="${false}"
              @message-sent="${this.handleMessageSent}"
            ></ask-ai-button>
          </footer>
        </div>
      </ask-ai-drawer>
    `;
  }

  public scrollToBottom(options?: ScrollToOptions) {
    if (!this.drawerOpen || !this.drawerEl) return;
    this.drawerEl.scrollToBottom(options || { behavior: "smooth" });
  }

  private handleSlotchange() {
    this.scrollToBottom();
  }

  private welcomeButton() {
    if (this.drawerOpen) {
      return html``;
    }

    return html`
      <ask-ai-button
        .placeholder="${this.placeholder}"
        .disabled="${this.disabled}"
        .showKeyboardShortcut="${true}"
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
