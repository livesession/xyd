import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { IconDislike, IconLike, IconCopy, IconRegenerate } from "./icons";

import styles from "./message.styles";

type MessageType = "user" | "assistant";

@customElement("ask-ai-message")
export class AskAIMessage extends LitElement {
  @property({ type: String })
  content = "";

  @property({ type: String, reflect: true })
  type: MessageType = "user";

  @property({ type: Boolean })
  showActions = false;

  static styles = [styles];

  render() {
    return html`
      ${this.content 
        ? html`<p aria-label="message">${this.content}</p>`
        : html`<slot aria-label="message"></slot>`
      }
      ${this.showActions && this.type === "assistant"
        ? this.renderActions()
        : ""}
    `;
  }

  private renderActions() {
    return html`
      <nav aria-label="Message actions">
        <ask-ai-button-icon
          title="Thumbs up"
          aria-label="Rate response positively"
          variant="default"
        >
          ${IconLike()}
        </ask-ai-button-icon>

        <ask-ai-button-icon
          title="Thumbs down"
          aria-label="Rate response negatively"
          variant="default"
        >
          ${IconDislike()}
        </ask-ai-button-icon>

        <ask-ai-button-icon
          title="Copy message"
          aria-label="Copy assistant response"
          variant="default"
        >
          ${IconCopy()}
        </ask-ai-button-icon>

        <ask-ai-button-icon
          title="Regenerate response"
          aria-label="Regenerate assistant response"
          variant="default"
        >
          ${IconRegenerate()}
        </ask-ai-button-icon>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ask-ai-msg": AskAIMessage;
  }
}
