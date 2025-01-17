import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {Badge} from "@xyd-js/components/writer";

export default {
    title: 'Components/Writer/Badge',
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <Badge kind="">
            Default
        </Badge>
    </div>
}

export const Warning = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <Badge kind="warning">
            Warning
        </Badge>
    </div>
}