import { css } from "lit";

export default css`
  :host {
    /* Design System Colors */
    --ask-ai-dark100: #000000;
    --ask-ai-dark80: #1f2937;
    --ask-ai-dark60: #374151;
    --ask-ai-dark40: #6b7280;
    --ask-ai-dark20: #9ca3af;
    --ask-ai-dark10: #d1d5db;
    --ask-ai-dark5: #e5e7eb;

    --ask-ai-light100: #ffffff;
    --ask-ai-light80: #f9fafb;
    --ask-ai-light60: #f3f4f6;
    --ask-ai-light40: #eef2f1;

    --ask-ai-blue60: #3b82f6;
    --ask-ai-blue40: #60a5fa;
    --ask-ai-blue20: #93c5fd;
  }

  :host {
    --ask-ai-border-color: color-mix(
      in srgb,
      var(--ask-ai-dark100) 20%,
      transparent
    );
    --ask-ai-border-focus-color: var(--ask-ai-blue60);
    --ask-ai-background-color: color-mix(
      in srgb,
      var(--ask-ai-light100) 90%,
      transparent
    );
    --ask-ai-backdrop-color: var(--ask-ai-light100);
    --ask-ai-text-color: var(--ask-ai-dark80);
    --ask-ai-placeholder-color: var(--ask-ai-dark40);
    --ask-ai-icon-color: var(--ask-ai-light100);
    --ask-ai-shadow-color: color-mix(
      in srgb,
      var(--ask-ai-dark100) 25%,
      transparent
    );
    --ask-ai-shadow-border: color-mix(
      in srgb,
      var(--ask-ai-dark100) 5%,
      transparent
    );
  }

  @media (prefers-color-scheme: dark) {
    :host {
      --ask-ai-border-color: color-mix(
        in srgb,
        var(--ask-ai-light100) 20%,
        transparent
      );
      --ask-ai-border-focus-color: var(--ask-ai-blue40);
      --ask-ai-background-color: var(--ask-ai-dark100);
      --ask-ai-backdrop-color: var(--ask-ai-dark100);
      --ask-ai-text-color: var(--ask-ai-dark5);
      --ask-ai-placeholder-color: var(--ask-ai-dark20);
    }
  }

  :host {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 4px 16px 24px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    overflow: hidden;
    z-index: 999999;
  }

  ask-ai-drawer [slot="messages"] footer {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 80px;
  }

  ask-ai-drawer [slot="messages"] ask-ai-button {
    position: fixed;
    bottom: 12px;
  }
`;
