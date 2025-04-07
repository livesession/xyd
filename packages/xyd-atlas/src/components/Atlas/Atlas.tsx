import React from "react";

import {Reference} from "@xyd-js/uniform";

import {MDXReference} from "@/utils/mdx";
import {ApiRefItem} from "@/components/ApiRef";

import * as cn from "@/components/Atlas/Atlas.styles";

export interface AtlasProps {
    references: MDXReference<Reference[]> | []
}

export function Atlas(props: AtlasProps) {
    return <div className={cn.AtlasHost}>
        {
            props.references?.map((reference, i) => <div key={i}>
                    <ApiRefItem
                        reference={{
                            ...reference
                        }}
                    />
                </div>
            )
        }
    </div>
}