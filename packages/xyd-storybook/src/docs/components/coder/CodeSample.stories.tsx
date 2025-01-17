import React, {} from 'react';
import type {Meta} from '@storybook/react';

import getContentComponents from "@xyd-js/components/content";

import Content from "../../../content/code-sample.mdx";
import {MemoryRouter} from "react-router";

export default {
    title: 'Components/Coder/CodeSample',
    decorators: [
        (Story) => <MemoryRouter>
            <Story/>
        </MemoryRouter>
    ]
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <Content components={getContentComponents()}/>
    </div>
}
