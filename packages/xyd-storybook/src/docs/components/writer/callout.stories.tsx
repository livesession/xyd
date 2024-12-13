import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {
    Callout,
} from '@xyd/components/writer';

export default {
    title: 'Components/Writer/Callout',
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <div style={{width: 700}}>
            <Callout>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis id sollicitudin diam. <br/>
                Aliquam tincidunt quam quis ultrices gravida.In elit nisl, varius nec ligula nec.
            </Callout>
        </div>
    </div>
}
