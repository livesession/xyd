import { css } from "lit";

export default css`
  /* Ask AI Button Icon Component Styles */
  :host {
    /* Color variables */
    --ask-ai-button-icon-border-color: var(--ask-ai-dark10);
    --ask-ai-button-icon-text-color: var(--ask-ai-dark80);
    --ask-ai-button-icon-placeholder-color: var(--ask-ai-dark40);
    --ask-ai-button-icon-bg: var(--ask-ai-blue20);
    --ask-ai-button-icon-bg-hover: var(--ask-ai-blue40);
    --ask-ai-button-icon-bg-disabled: var(--ask-ai-dark5);
    --ask-ai-button-icon-icon-color: var(--ask-ai-light100);

    display: inline-flex;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    :host {
      --ask-ai-button-icon-border-color: var(--ask-ai-dark20);
      --ask-ai-button-icon-text-color: var(--ask-ai-dark5);
      --ask-ai-button-icon-placeholder-color: var(--ask-ai-dark20);
      --ask-ai-button-icon-bg: var(--ask-ai-blue20);
      --ask-ai-button-icon-bg-hover: var(--ask-ai-blue40);
      --ask-ai-button-icon-bg-disabled: var(--ask-ai-dark20);
    }
  }

  /* Base button styles */
  button {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    color: var(--ask-ai-button-icon-placeholder-color);

    &:focus {
      outline: 2px solid var(--ask-ai-button-icon-bg);
      outline-offset: 2px;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
      color: var(--ask-ai-button-icon-placeholder-color);
    }
  }
  button svg {
    width: 16px;
    height: 16px;
    display: block;
    vertical-align: middle;
  }

  /* Default variant - for message actions */
  :host([variant="default"]) button {
    padding: 6px;
    border-radius: 4px;
    min-width: 32px;
    min-height: 32px;
  }

  :host([variant="default"]) button:hover:not(:disabled) {
    background-color: var(--ask-ai-button-icon-border-color);
    color: var(--ask-ai-button-icon-text-color);
  }

  /* Compact variant - for smaller contexts */
  :host([variant="compact"]) button {
    padding: 4px;
    border-radius: 4px;
    min-width: 28px;
    min-height: 28px;
  }

  :host([variant="compact"]) button:hover:not(:disabled) {
    background-color: var(--ask-ai-button-icon-border-color);
    color: var(--ask-ai-button-icon-text-color);
  }

  /* Header variant - for drawer header */
  :host([variant="header"]) button {
    padding: 8px;
    border-radius: 4px;
    color: var(--ask-ai-button-icon-text-color);
    min-width: 32px;
    min-height: 32px;
  }

  :host([variant="header"]) button:hover:not(:disabled) {
    background-color: var(--ask-ai-button-icon-border-color);
  }

  :host([variant="compact"]) button svg {
    width: 14px;
    height: 14px;
  }

  :host([variant="header"]) button svg {
    width: 16px;
    height: 16px;
  }

  /* Icon placeholder for fallback */
  [data-icon="placeholder"] {
    font-size: 14px;
    line-height: 1;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    :host button {
      transition: none !important;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    :host button:focus {
      outline-width: 3px;
    }

    :host button {
      border: 1px solid transparent;
    }

    :host button:hover:not(:disabled) {
      border-color: var(--ask-ai-button-icon-text-color);
    }
  }
`;
