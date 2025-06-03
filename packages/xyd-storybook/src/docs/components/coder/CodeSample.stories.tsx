import React, {} from 'react';
import type {Meta} from '@storybook/react';
import {MemoryRouter} from "react-router";

import {ReactContent} from "@xyd-js/components/content";

import Content from "../../../__fixtures__/code-sample.mdx";

const reactContent = new ReactContent()
const contentComponents = reactContent.components()

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
        <Content components={contentComponents}/>
    </div>
}
