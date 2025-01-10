import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {
    NavLinks,
} from '@xyd-js/components/writer';

export default {
    title: 'Components/Writer/NavLinks',
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <div style={{width: 700}}>
            <NavLinks
                prev={{
                    title: "Previous",
                    href: "#"
                }}
                next={{
                    title: "Next",
                    href: "#"
                }}
            />
        </div>
    </div>
}
