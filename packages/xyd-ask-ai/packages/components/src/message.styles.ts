import { css } from "lit";

export default css`
  /* Base component styles */
  :host {
    /* Color variables */
    --ask-ai-msg-border-color: none;
    --ask-ai-msg-shadow: none;
    --ask-ai-msg-text-color: var(--ask-ai-dark80);
    --ask-ai-msg-placeholder-color: var(--ask-ai-dark40);
    --ask-ai-msg-bg: transparent;

    --ask-ai-msg-user-bg: var(--ask-ai-light40);
    --ask-ai-msg-user-text-color: var(--ask-ai-msg-text-color);

    --ask-ai-msg-border-radius: 18px 4px 18px 18px;
  }

  @media (prefers-color-scheme: dark) {
    :host {
      --ask-ai-msg-border-color: none;
      --ask-ai-msg-shadow-color: none;
      --ask-ai-msg-text-color: var(--ask-ai-dark5);
      --ask-ai-msg-placeholder-color: var(--ask-ai-dark20);
      --ask-ai-msg-bg: transparent;

      --ask-ai-msg-user-bg: var(--ask-ai-light40);
      --ask-ai-msg-user-text-color: var(--ask-ai-msg-text-color);
    }
  }

  :host {
    display: flex;
    margin-bottom: 16px;
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      * {
        transition: none !important;
      }
    }
  }

  @media (prefers-contrast: high) {
    :host([type="assistant"]) p {
      border-width: 2px;
    }
  }

  :host([type="user"]) {
    --ask-ai-msg-text-color: var(--ask-ai-dark60);
    justify-content: flex-end;
  }
  :host([type="user"]) > p, :host([type="user"]) slot {
    background-color: var(--ask-ai-msg-user-bg);
    color: var(--ask-ai-msg-user-text-color);
    padding: 12px 8px;
    border-radius: var(--ask-ai-msg-border-radius);
    margin: 0;
    display: inline-block;
    max-width: 80%;
    box-shadow: var(--ask-ai-msg-shadow);
  }

  :host([type="assistant"]) {
    justify-content: flex-start;
  }
  :host([type="assistant"]) > p, :host([type="assistant"]) slot {
    background-color: var(--ask-ai-msg-bg);
    color: var(--ask-ai-msg-text-color);
    padding: 12px 8px;
    border-radius: var(--ask-ai-msg-border-radius);
    margin: 0;
    display: inline-block;
    max-width: 90%;
    border: 1px solid var(--ask-ai-msg-border-color);
    box-shadow: var(--ask-ai-msg-shadow);
  }

  nav {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
`;
