import React from "react";

import {MDXCommonAtlasProps} from "./types";
import {AtlasPrimary} from "./AtlasPrimary";
import {AtlasSecondary} from "./AtlasSecondary";

import * as cn from "./Atlas.styles";

interface AtlasProps<T> extends MDXCommonAtlasProps<T> {
    kind: "secondary" | "primary" | undefined | null
}

export function Atlas<T>(props: AtlasProps<T>) {
    let AtlasComponent: React.FC<MDXCommonAtlasProps<T>>;

    if (props.kind === "secondary") {
        AtlasComponent = AtlasSecondary;
    } else {
        AtlasComponent = AtlasPrimary;
    }

    let references = props.references
    {
        // TODO: find better solution - if we pass from md then its string
        if (references && typeof references === "string") { // TODO: DO IT BETTER
            try {
                references = JSON.parse(references)
            } catch (error) {
                console.error("Error parsing references", error)
            }
        }
    }

    return <div className={cn.AtlasHost}>
        <AtlasComponent references={references}/>
    </div>
}