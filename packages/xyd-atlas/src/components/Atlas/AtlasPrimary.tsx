import React, {  } from "react";

import {ApiRefItem} from "@/components/ApiRef";

import {MDXCommonAtlasProps} from "./types";

export function AtlasPrimary<T>(props: MDXCommonAtlasProps<T>) {
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