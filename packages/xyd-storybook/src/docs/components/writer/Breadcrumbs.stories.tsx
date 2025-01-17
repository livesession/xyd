import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {
    Breadcrumbs,
} from '@xyd-js/components/writer';

export default {
    title: 'Components/Writer/Breadcrumbs',
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <div style={{width: 700}}>
            <Breadcrumbs items={[
                {
                    title: "Home",
                    href: "/",
                },
                {
                    title: "Docs",
                    href: "/docs",
                },
                {
                    title: "Components"
                },
            ]}/>
        </div>
    </div>
}
