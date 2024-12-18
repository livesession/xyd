import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {SubNav} from '@xyd/ui2';

export default {
    title: 'UI/SubNav',
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <SubNav title="Apps" value="build">
            <SubNav.Item value="build" href="/build">
                Build
            </SubNav.Item>
            <SubNav.Item value="design" href="/design">
                Design
            </SubNav.Item>
            <SubNav.Item value="launch" href="/launch">
                Launch
            </SubNav.Item>
        </SubNav>
    </div>
}

