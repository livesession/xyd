import React from "react";

import {Reference} from "@xyd/uniform";

import {MDXReference} from "@/utils/mdx";
import {ApiRefItem} from "@/components/ApiRef";

import {
    $atlas
} from "@/components/Atlas/Atlas.styles";

export interface AtlasProps {
    references: MDXReference<Reference[]> | []
}

export function Atlas(props: AtlasProps) {
    return <div className={$atlas.host}>
        {
            props.references.map((reference, i) => <div key={i}>
                    <ApiRefItem reference={reference}/>
                </div>
            )
        }
    </div>
}