import React, {useState, useEffect} from 'react';
import type {Meta} from '@storybook/react';

import {Reference} from '@xyd/uniform';
import {Atlas} from "@xyd/atlas";

import {uniformToReferences} from "./uniform-to-references";
import {MDXReference} from "../../utils/mdx.ts";

const HelloWorld = () => {
    return <h1>Hello, World!</h1>;
};

export default {
    title: 'Atlas/Atlas',
    component: HelloWorld,
} as Meta;

// const Template = (args) => <Atlas/>;

const Template = (args) => {
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
