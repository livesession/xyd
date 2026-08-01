import type { Preview } from "@storybook/react";
import "./storybook.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "surface",
      values: [
        { name: "surface", value: "#ffffff" },
        { name: "muted", value: "#f9f9f9" },
      ],
    },
    options: {
      // Explicit top-level order (Design System first), alphabetical within.
      storySort: {
        method: "alphabetical",
        order: [
          "Design System",
          ["Icons", "Design tokens", "*"],
          "Components",
          "SDK Wizard",
          "Auth",
          "LA",
          "*",
        ],
      },
    },
  },
};

export default preview;
