import React from "react";

import {ApiRefItem} from "@/components/ApiRef";
import {MDXReferenceWrapper} from "@/utils/mdx";

import {CommonAtlasProps} from "./types";

export function AtlasPrimary<T>(props: CommonAtlasProps<T>) {
    return <>
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
    </>
}