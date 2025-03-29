import React, {useState, useEffect} from 'react';
import type {Meta} from '@storybook/react';

import {Reference} from '@xyd-js/uniform';
import {Atlas} from "@xyd-js/atlas";

import {uniformToReferences} from "./uniform-to-references";
import {MDXReference} from "../../utils/mdx";

export default {
    title: 'Atlas/Atlas',
    component: Atlas,
} as Meta;

const Template = (args: any) => {
    const [references, setReferences] = useState<MDXReference<Reference[]> | []>([])

    async function load() {
        const resp = await uniformToReferences()
        if (resp && resp.length) {
            setReferences(resp)
        }
    }

    useEffect(() => {
        load()
    }, [])

    return <div style={{
        width: "1200px",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        margin: "0 auto"
    }}>
        <Atlas references={references}/>
    </div>
}

export const Default = Template.bind({});
Default.args = {};

