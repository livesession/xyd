import type {Preview} from "@storybook/react";

import "@xyd/ui2/index.css";
import "@xyd/fable-wiki/atlas.css"
import '@xyd/atlas/index.css';
import "@xyd/components/index.css";

import '../src/index.css';

const preview: Preview = {
    parameters: {
        options: {
            storySort: {
                order: [
                    'Atlas',
                    'Components', ['Writer', 'Coder'],
                    'UI',
                    'Layouts',
                    'Themes', ['Default', 'Design System'],
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
