import React, { createContext, useContext, useState } from "react";

import { Definition, DefinitionVariant, Meta, OpenAPIReferenceContext, Reference, ReferenceCategory } from "@xyd-js/uniform";
import { Heading, Code } from "@xyd-js/components/writer";

import { MDXReference, uniformChild, uniformValue } from "@/utils/mdx";
import {
    ApiRefProperties,
    ApiRefSamples
} from "@/components/ApiRef";
import * as cn from "@/components/ApiRef/ApiRefItem/ApiRefItem.styles";

export interface ApiRefItemProps {
    reference: MDXReference<Reference>
}

// TODO: context with current referene?
export function ApiRefItem({ reference }: ApiRefItemProps) {
    return <atlas-apiref-item className={cn.ApiRefItemHost}>
        <atlas-apiref-item-showcase className={cn.ApiRefItemGrid}>
            <div>
                <$IntroHeader reference={reference} />
                <$Definitions reference={reference} />
            </div>

            {reference.examples && <ApiRefSamples examples={reference.examples} />}
        </atlas-apiref-item-showcase>
    </atlas-apiref-item>
}

function $IntroHeader({ reference }: ApiRefItemProps) {
    let topNavbar;

    switch (reference?.category) {
        case ReferenceCategory.REST: {
            const ctx = reference.context as MDXReference<OpenAPIReferenceContext>

            if (!ctx || !ctx.method || !ctx.fullPath) {
                break;
            }

            // TODO: finish subitlte from ref
            topNavbar = <$Navbar
                label={uniformValue(ctx.method)}
                subtitle={`${uniformValue(ctx.fullPath)}`}
            />
            break;
        }
    }
    return <>
        <$Title title={uniformValue(reference.title)} />

        {topNavbar}

        {uniformChild(reference.description)}
    </>
}

function $Authorization({ reference }: ApiRefItemProps) {
    if (!reference.context) {
        return null;
    }

    const context = reference.context as OpenAPIReferenceContext;

    if (!context.scopes || !context.scopes.length) {
        return null;
    }

    return <div>
        <div className={cn.ApiRefItemDefinitionsItem}>
            <div part="header">
                <$Subtitle title="Scopes" />
            </div>

            <$DefinitionBody definition={{
                description: <>
                    Required scopes: {context.scopes.map(s => <Code>{s}</Code>)}
                </>
            }}
            />
        </div>
    </div>
}

const VariantContext = createContext<{
    variant?: DefinitionVariant,
    setVariant: (variant: DefinitionVariant) => void
}>({
    variant: undefined,
    setVariant: () => { }
});


function $Definitions({ reference }: ApiRefItemProps) {
    return <atlas-apiref-definitions className={cn.ApiRefItemDefinitionsHost}>
        <$Authorization reference={reference} />

        {reference?.definitions?.map((definition, i) => {
            return <$VariantsProvider key={i} definition={definition}>
                <div>
                    {
                        definition?.title ? <div key={i} className={cn.ApiRefItemDefinitionsItem}>
                            <div part="header">
                                <$Subtitle title={uniformValue(definition.title)} />
                                <div part="controls">
                                    <$VariantSelect variants={definition.variants} />

                                    <$ContentType definition={definition} />
                                </div>
                            </div>

                            <$DefinitionBody definition={definition} />
                        </div> : null
                    }
                </div>
            </$VariantsProvider>
        }
        )}
    </atlas-apiref-definitions>
}

function $ContentType({ definition }: { definition: MDXReference<Definition> }) {
    const { variant } = useContext(VariantContext);

    if (!variant?.meta) {
        return <div>
            {getContentType(definition.meta || [])}
        </div>
    }

    return <div>
        {getContentType(variant.meta || [])}
    </div>

}

function $VariantsProvider({ definition, children }: { definition: MDXReference<Definition>, children: React.ReactNode }) {
    const firstVariant = (definition.variants || []).find(v => v.meta?.find(m => m.name === "status" && m.value === "200")) || (definition.variants || [])[0];
    const [variant, setVariant] = useState<DefinitionVariant | undefined>(firstVariant);

    return <VariantContext value={{ variant, setVariant }}>
        {children}
    </VariantContext>
}

function $VariantSelect({ variants }: { variants: MDXReference<DefinitionVariant[]> }) {
    const { variant, setVariant } = useContext(VariantContext);

    function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const foundVariant = variants.find(variant => {
            const status = (variant?.meta || []).find(m => m.name === "status");

            return status?.value === e.target.value;
        })
        if (!foundVariant) {
            return
        }

        setVariant(foundVariant);
    }

    const status = (variant?.meta || []).find(m => m.name === "status");

    return variants?.length ? <select value={status?.value} onChange={onChange}>
        {
            variants?.map((variant, i) => {
                // TODO: support custom component by status
                const status = (variant?.meta || []).find(m => m.name === "status");

                const value = status?.value || variant.title;

                return <option value={value}>{value}</option>
            })
        }
    </select> : null
}


function $DefinitionBody({ definition }: { definition: MDXReference<Definition> }) {
    const { variant } = useContext(VariantContext);

    return <div part="body">
        {
            definition.description && <div>
                {uniformChild(definition.description)}
            </div>
        }

        {
            variant && variant.properties?.length
                ? <ApiRefProperties properties={variant.properties} />
                : definition.properties?.length ? <ApiRefProperties properties={definition.properties} /> : null
        }

    </div>
}

function $Navbar({ label, subtitle }: { label: string, subtitle: string }) {
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

function $Title({ title }: { title: string }) {
    return <>
        <Heading size={1}>
            {title}
        </Heading>
    </>
}

function $Subtitle({ title }: { title: string }) {
    return <>
        <Heading size={3}>
            {title}
        </Heading>
    </>
}

function getContentType(meta: Meta[]) {
    return meta.find(m => m.name === "contentType")?.value
}