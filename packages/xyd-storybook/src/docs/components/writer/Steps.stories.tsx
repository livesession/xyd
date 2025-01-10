import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {
    Steps,
} from '@xyd-js/components/writer';

export default {
    title: 'Components/Writer/Steps',
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <Steps>
            <Steps.Item>
                First, you need to install the package.
            </Steps.Item>
            <Steps.Item>
                Then you need to import the component.
            </Steps.Item>
        </Steps>
    </div>
}
