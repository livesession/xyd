import React, {useState, useEffect} from 'react';
import type {Meta} from '@storybook/react';

import {Reference} from '@xyd-js/uniform';
import {Atlas} from "@xyd-js/atlas";

import {uniformToReferences} from "./uniform-to-references";
import {MDXReference} from "../../utils/mdx";
import {exampleSourceUniform} from "../../__fixtures__/example-source-uniform";
import {DocsTemplateDecorator} from "../../decorators/DocsTemplate";

export default {
    title: 'Atlas/Atlas',
    component: Atlas,
    decorators: [
        DocsTemplateDecorator({toc: false}),
    ]
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

    return <>
        <Atlas references={references}/>
    </>
}

export const Primary = Template.bind({});
Primary.args = {};


const TemplateSecondary = () => {
    return <>
        <Atlas kind="secondary" references={[exampleSourceUniform]}/>
    </>
}

export const Secondary = TemplateSecondary.bind({});
Secondary.args = {};

