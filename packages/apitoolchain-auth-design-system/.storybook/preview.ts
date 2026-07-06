import type { Preview } from "@storybook/react";
import "../src/styles/storybook.css";

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
      storySort: { method: "alphabetical" },
    },
  },
};

export default preview;
