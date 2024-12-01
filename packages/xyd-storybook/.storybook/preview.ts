import type { Preview } from "@storybook/react";

import "@xyd/ui/index.css";
import '@xyd/atlas/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
