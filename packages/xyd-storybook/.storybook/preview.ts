import type {Preview} from "@storybook/react";

import "@xyd-js/atlas/index.css"
import "@xyd-js/fable-wiki/theme.css"

import './styles.css'

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
