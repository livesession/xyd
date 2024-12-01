import React from "react";

import {OpenAPIReferenceContext, Reference, ReferenceCategory} from "@xyd/uniform";

import {MDXReference} from "@/utils/mdx";
import {
    ApiRefProperties,
    ApiRefSamples
} from "@/components/ApiRef";
import {
    $navbar,
    $refItem,
    $properties,
    $subtitle,
    $title
} from "@/components/ApiRef/ApiRefItem/ApiRefItem.styles";

export interface ApiRefItemProps {
    reference: MDXReference<Reference>
}

// TODO: context with current referene?
export function ApiRefItem({reference}: ApiRefItemProps) {
    let topNavbar;

    switch (reference?.category?.title) {
        case ReferenceCategory.REST: {
            const ctx = reference.context as MDXReference<OpenAPIReferenceContext>

            // TODO: finish subitlte from ref
            topNavbar = <$Navbar label={ctx.method.title} subtitle={`${ctx.path.title}`}/>
            break;
        }
    }

    return <div className={$refItem.host}>
        <$Title title={reference.title || ""}/>

        {topNavbar}

        <div className={$refItem.grid}>
            <$Properties reference={reference}/>
            <ApiRefSamples examples={reference.examples}/>
        </div>

    </div>
}

function $Properties({reference}: ApiRefItemProps) {
    return <div className={$properties.host}>
        {reference?.definitions?.map((definition, i) => <div key={i}>
            {
                definition.properties?.length && <div key={i} className={$properties.item}>
                    <$Subtitle title={definition.title.title}/>

                    <ApiRefProperties properties={definition.properties}/>
                </div>
            }
        </div>)}
    </div>
}

function $Navbar({label, subtitle}: { label: string, subtitle: string }) {
    return <>
        <div className={$navbar.host}>
            <span className={$navbar.container}>
                <span className={$navbar.label}>
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
        <h1 className={$title.host}>
            <a className={$title.link}>
                {title}
            </a>
        </h1>
    </>
}

function $Subtitle({title}: { title: string }) {
    return <>
        <h1 className={$subtitle.host}>
            <a className={$subtitle.link}>
                {title}
            </a>
        </h1>
    </>
}