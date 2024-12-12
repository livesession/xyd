import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {
    Pre
} from "@xyd/components/coder"

export default {
    title: 'Components/Coder/Pre',
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <Pre>
            {`import {Pre} from '@xyd/components/coder'`}
        </Pre>
    </div>
}

