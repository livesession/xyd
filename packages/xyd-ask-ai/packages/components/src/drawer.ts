import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { IconClose } from "./icons";

import styles from "./drawer.styles";

@customElement("ask-ai-drawer")
export class AskAIDrawer extends LitElement {
  @property({ type: Boolean })
  open = false;

  static styles = [styles];

  render() {
    return html`
        <header>
          <h2>
            <slot name="title"></slot>
          </h2>
          <ask-ai-button-icon
            @button-click="${this.closeDrawer}"
            aria-label="Close chat drawer"
            variant="header"
          >
            ${IconClose()}
          </ask-ai-button-icon>
        </header>

        <main>
          <section aria-label="Chat conversation">
            <slot name="messages"></slot>
          </section>
        </main>
    `;
  }

  public scrollToBottom(options?: ScrollToOptions) {
    const scroller = this.renderRoot?.querySelector(
      "main"
    ) as HTMLElement | null;
    if (!scroller) return;
    const behavior = options?.behavior ?? "auto";
    const left = options?.left ?? 0;
    requestAnimationFrame(() => {
      scroller.scrollTo({ top: scroller.scrollHeight, left, behavior });
    });
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has("open") && this.open) {
      this.scrollToBottom({ behavior: "auto" });
    }
  }

  private closeDrawer() {
    this.dispatchEvent(
      new CustomEvent("drawer-close", {
        bubbles: true,
        composed: true,
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ask-ai-drawer": AskAIDrawer;
  }
}
