import React from "react";

import {OpenAPIReferenceContext, Reference, ReferenceCategory} from "@xyd-js/uniform";
import {Heading, Anchor} from "@xyd-js/components/writer";

import {MDXReference, uniformChild, uniformValue} from "@/utils/mdx";
import {
    ApiRefProperties,
    ApiRefSamples
} from "@/components/ApiRef";
import * as cn from "@/components/ApiRef/ApiRefItem/ApiRefItem.styles";
import {Header} from "@xyd-js/website/src/app/components";

export interface ApiRefItemProps {
    reference: MDXReference<Reference>
}

// TODO: context with current referene?
export function ApiRefItem({reference}: ApiRefItemProps) {
    let topNavbar;

    switch (reference?.category?.title) {
        case ReferenceCategory.REST: {
            const ctx = reference.context as MDXReference<OpenAPIReferenceContext>

            if (!ctx || !ctx.method || !ctx.path || !ctx.path.title) {
                break;
            }

            // TODO: finish subitlte from ref
            topNavbar = <$Navbar
                label={uniformValue(ctx.method)}
                subtitle={`${decodeURIComponent(uniformValue(ctx.path))}`}
            />
            break;
        }
    }

    return <div className={cn.ApiRefItemHost}>
        <$Title title={uniformValue(reference.title)}/>

        {topNavbar}

        {uniformChild(reference.description)}

        <div className={cn.ApiRefItemGrid}>
            <$Properties reference={reference}/>
            {reference.examples && <ApiRefSamples examples={reference.examples}/>}
        </div>
    </div>
}

function $Properties({reference}: ApiRefItemProps) {
    return <div className={cn.ApiRefItemPropertiesHost}>
        {reference?.definitions?.map((definition, i) => <div key={i}>
            {
                definition.properties?.length && <div key={i} className={cn.ApiRefItemPropertiesItem}>
                    <$Subtitle title={uniformValue(definition.title)}/>

                    <ApiRefProperties properties={definition.properties}/>
                </div>
            }
        </div>)}
    </div>
}

function $Navbar({label, subtitle}: { label: string, subtitle: string }) {
    return <>
        <div className={cn.ApiRefItemNavbarHost}>
            <span className={cn.ApiRefItemNavbarContainer}>
                <span className={cn.ApiRefItemNavbarLabel}>
                   {label.toUpperCase()}
                </span>
                <span>
                    {subtitle}
                </span>
            </span>
        </div>
    </>
}

function $Title({title}: { title: string }) {
    return <>
        <Heading size={2}>
            {title}
        </Heading>
    </>
}

function $Subtitle({title}: { title: string }) {
    return <>
        <Heading size={3}>
            {title}
        </Heading>
    </>
}