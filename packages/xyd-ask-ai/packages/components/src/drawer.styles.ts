import { css } from "lit";

export default css`
  /* Ask AI Drawer Component Styles */
  :host {
    /* Color variables */
    --ask-ai-drawer-border-color: var(--ask-ai-dark10);
    --ask-ai-drawer-background-color: var(--ask-ai-light100);
    --ask-ai-drawer-text-color: var(--ask-ai-dark80);
    --ask-ai-drawer-placeholder-color: var(--ask-ai-dark40);
    --ask-ai-drawer-button-bg: var(--ask-ai-blue20);
    --ask-ai-drawer-button-bg-hover: var(--ask-ai-blue40);
    --ask-ai-drawer-shadow-color: var(--ask-ai-dark100);
    --ask-ai-drawer-shadow-border: var(--ask-ai-dark5);
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    :host {
      --ask-ai-drawer-border-color: var(--ask-ai-dark60);
      --ask-ai-drawer-background-color: var(--ask-ai-dark100);
      --ask-ai-drawer-text-color: var(--ask-ai-dark5);
      --ask-ai-drawer-placeholder-color: var(--ask-ai-dark20);
      --ask-ai-drawer-button-bg: var(--ask-ai-blue20);
      --ask-ai-drawer-button-bg-hover: var(--ask-ai-blue40);
    }
  }

  aside {
    position: fixed;
    top: 0;
    bottom: 0;
    right: -400px;
    width: 400px;
    background-color: var(--ask-ai-drawer-background-color);
    border-left: 1px solid var(--ask-ai-drawer-border-color);
    /* box-shadow: -4px 0 20px var(--ask-ai-drawer-shadow-color); */
    transition: right 0.3s ease-in-out;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(12px);
  }

  :host([open]) aside {
    right: 0;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--ask-ai-drawer-border-color);
    background-color: var(--ask-ai-drawer-background-color);
    flex-shrink: 0;
  }

  header h2,
  header h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--ask-ai-drawer-text-color);
    display: flex;
    align-items: center;
    gap: 8px;

    /* span {
        font-size: 16px;
        display: inline-block;
        display: none;
      } */
  }
  header button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    color: var(--ask-ai-drawer-text-color);
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  header button:hover {
    background-color: var(--ask-ai-drawer-border-color);
  }
  header button:focus {
    outline: 2px solid var(--ask-ai-drawer-button-bg);
    outline-offset: 2px;
  }

  main {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  main section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    :host {
      width: 100vw;
      right: -100vw;

      main {
        padding: 16px;
      }

      header {
        padding: 16px;
      }
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    :host {
      transition: none !important;

      header button {
        transition: none !important;
      }
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    :host {
      border-left-width: 2px;

      header button:focus {
        outline-width: 3px;
      }
    }
  }
`;
