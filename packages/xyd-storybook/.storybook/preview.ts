import type {Preview} from "@storybook/react";

import "@xyd/ui/index.css";
import '@xyd/atlas/index.css';
import "@xyd/components/index.css";

const preview: Preview = {
    parameters: {
        options: {
            storySort: {
                order: [
                    'Atlas',
                    'Components', ['Writer', 'Coder', 'Demos'],
                    'UI',
                    'Themes'
                ], // TODO: nested sorting
            },
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
};

export default preview;
