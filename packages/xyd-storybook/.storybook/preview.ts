import type {Preview} from "@storybook/react";

// import "@xyd-js/theme-poetry/index.css" // TODO: in the future configurable themes via UI?
// import "@xyd-js/theme-gusto/index.css" // TODO: in the future configurable themes via UI?
// import "@xyd-js/theme-opener/index.css" // TODO: in the future configurable themes via UI?
import "@xyd-js/theme-solar/index.css" // TODO: in the future configurable themes via UI?

import './styles.css'

const preview: Preview = {
    parameters: {
        options: {
            storySort: {
                order: [
                    'Components', ['Writer', 'Coder'],
                    'Atlas',
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
        // Source addon configuration
        docs: {
            source: {
                state: 'open', // 'open' | 'closed' | 'none'
                type: 'auto', // 'auto' | 'code' | 'dynamic'
                excludeDecorators: true,
            },
        },
    },
};

export default preview;
