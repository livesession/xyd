import React, {} from 'react';
import type {Meta} from '@storybook/react';
import {MemoryRouter} from "react-router";

import getContentComponents from "@xyd-js/components/content";

import Content from "../../../content/code-sample.mdx";

export default {
    title: 'Components/Coder/CodeSample',
    decorators: [
        (Story) => <MemoryRouter>
            <Story/>
        </MemoryRouter>
    ]
} as Meta;

export const Default = async () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <Content components={getContentComponents()}/>
    </div>
}
