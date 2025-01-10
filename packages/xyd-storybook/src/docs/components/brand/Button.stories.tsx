import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {Button} from "@xyd-js/components/brand";

export default {
    title: 'Components/Brand/Button',
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <Button>
            Primary
        </Button>
    </div>
}

export const Secondary = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <Button kind="secondary">
            Secondary
        </Button>
    </div>
}