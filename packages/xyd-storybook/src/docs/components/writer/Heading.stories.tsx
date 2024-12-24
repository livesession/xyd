import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {
    Heading
} from "@xyd/components/writer"

export default {
    title: 'Components/Writer/Heading',
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column"
    }}>
        <div>
            <Heading id="heading-1">
                Heading 1
            </Heading>
        </div>
        <div>
            <Heading size={2} id="heading-2">
                Heading 2
            </Heading>
        </div>
        <div>
            <Heading size={3} id="heading-3">
                Heading 3
            </Heading>
        </div>
        <div>
            <Heading size={4} id="heading-4">
                Heading 4
            </Heading>
        </div>
        <div>
            <Heading size={5} id="heading-5">
                Heading 5
            </Heading>
        </div>
        <div>
            <Heading size={6} id="heading-6">
                Heading 6
            </Heading>
        </div>
    </div>
}

