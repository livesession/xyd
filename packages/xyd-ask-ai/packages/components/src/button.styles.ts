import { css } from "lit";

export default css`
  :host {
    --ask-ai-btn-bg: color-mix(in srgb, var(--ask-ai-blue60) 30%, transparent);
    --ask-ai-btn-bg--hover: color-mix(
      in srgb,
      var(--ask-ai-blue60) 50%,
      transparent
    );
    --ask-ai-btn-bg--disabled: color-mix(
      in srgb,
      var(--ask-ai-blue60) 20%,
      transparent
    );

    transition:
      transform 0.5s,
      opacity 0.2s,
      left 0.2s,
      width 0.4s;

    transform: translateY(0);
    opacity: 1;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    :host {
      --ask-ai-btn-bg: color-mix(
        in srgb,
        var(--ask-ai-blue40) 30%,
        transparent
      );
      --ask-ai-btn-bg--hover: color-mix(
        in srgb,
        var(--ask-ai-blue40) 50%,
        transparent
      );
      --ask-ai-btn-bg--disabled: color-mix(
        in srgb,
        var(--ask-ai-blue40) 20%,
        transparent
      );
    }
  }

  [part="kbd"] {
    color: var(--ask-ai-btn-bg);
    margin: 0px 10px;
  }

  form {
    z-index: 10;
    width: 100%;
    max-width: 320px;
  }

  @media (min-width: 640px) {
    form {
      width: 320px;
    }
  }

  :host(:hover) {
    transform: scale(1);
  }

  :host([variant="secondary"]:hover) {
    transform: none;
  }

  @media (min-width: 640px) {
    :host(:hover) {
      transform: scale(1.05);
    }
  }

  form:focus-within {
    width: 100%;
  }

  @media (min-width: 640px) {
    form:focus-within {
      width: 416px;
    }
  }

  form:focus-within:hover {
    transform: scale(1);
  }

  fieldset {
    padding-left: 20px;
    padding-right: 12px;
    border: 1px solid var(--ask-ai-border-color);
    border-radius: 16px;
    background-color: var(--ask-ai-background-color);
    backdrop-filter: blur(24px);
    box-shadow:
      0 25px 50px -12px var(--ask-ai-shadow-color),
      0 0 0 1px var(--ask-ai-shadow-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: border-color 0.4s;
    margin: 0;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  :host([variant="secondary"]) fieldset {
    box-shadow: none;
  }

  fieldset:focus-within {
    border-color: var(--ask-ai-border-focus-color);
  }

  input {
    padding: 12px 0;
    flex: 1;
    background: transparent;
    color: var(--ask-ai-text-color);
    outline: none;
    font-size: 16px;
    line-height: 24px;
    border: none;
    font-family: inherit;
  }

  input::placeholder {
    color: var(--ask-ai-placeholder-color);
    opacity: 1;
  }

  @media (min-width: 640px) {
    input {
      font-size: 14px;
      line-height: 20px;
    }
  }

  button {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 4px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: var(--ask-ai-btn-bg);
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  button:hover:not(:disabled) {
    background-color: var(--ask-ai-btn-bg--hover);
    transform: scale(1.1);
  }
  button:disabled {
    background-color: var(--ask-ai-btn-bg--disabled);
    cursor: not-allowed;
    opacity: 0.6;
  }

  svg {
    width: 20px;
    height: 20px;
    color: var(--ask-ai-icon-color);
    display: block;
    vertical-align: middle;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    form,
    fieldset,
    button {
      transition: none !important;
      animation: none !important;
    }

    :host(:hover) {
      transform: none;
    }
  }
`;
