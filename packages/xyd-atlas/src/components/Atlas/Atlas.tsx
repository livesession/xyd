import React from "react";

import {CommonAtlasProps} from "./types";
import {AtlasPrimary} from "./AtlasPrimary";
import {AtlasSecondary} from "./AtlasSecondary";

import * as cn from "./Atlas.styles";

interface AtlasProps<T> extends CommonAtlasProps<T> {
    kind: "secondary" | "primary" | undefined | null
}

export function Atlas<T>(props: AtlasProps<T>) {
    let AtlasComponent: React.FC<CommonAtlasProps<T>>;

    if (props.kind === "secondary") {
        AtlasComponent = AtlasSecondary;
    } else {
        AtlasComponent = AtlasPrimary;
    }

    return <div className={cn.AtlasHost}>
        <AtlasComponent references={props.references} />
    </div>
}