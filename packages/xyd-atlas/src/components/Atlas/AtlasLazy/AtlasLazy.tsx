import React, {useEffect, useRef} from "react";

import {Reference} from "@xyd-js/uniform";

import {ApiRefItem} from "@/components/ApiRef";

import * as cn from "./AtlasLazy.styles";

export interface AtlasLazyProps {
    references: Reference[]
    urlPrefix: string
    slug: string,
    onLoaded?: () => void
}

export function AtlasLazy(props: AtlasLazyProps) {
    return props.references?.map((reference: any, i: number) => <>
        <div
            key={i}
            // TODO: slug should be passed from reference or somrthing
            // ref={`api-reference/${reference.title}` === slug ? targetRef : null} // Attach ref to the 30th item
            className={`${cn.AtlasLazyItemHost} ${i === 0 && cn.AtlasLazyItemFirst}`}
            // TODO: slug prefix props
            data-slug={`${props.urlPrefix}/${reference.canonical?.title}`}
        >
            <ItemWrapper
                reference={reference}
                onLoad={i === props.references.length - 1 ? props.onLoaded : null}
            />
        </div>
    </>)
}

function ItemWrapper({reference, onLoad}) {
    useEffect(() => {
        onLoad && onLoad()
    }, []);

    return <>
        <ApiRefItem reference={reference}/>
    </>
}