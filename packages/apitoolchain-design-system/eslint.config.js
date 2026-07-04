import react from "eslint-plugin-react";
import tseslint from "typescript-eslint";

/**
 * Focused lint: forbid inline `style={}` on both DOM elements and components so
 * every style flows through Tailwind utility classes (no runtime CSSProperties).
 * General linting/formatting is handled by Biome; this config exists purely to
 * enforce the no-inline-style guarantee across the design system.
 */
export default tseslint.config(
  { ignores: ["dist", "storybook-static", "node_modules"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react },
    settings: { react: { version: "detect" } },
    rules: {
      "react/forbid-dom-props": ["error", { forbid: ["style"] }],
      "react/forbid-component-props": ["error", { forbid: ["style"] }],
    },
  },
);
