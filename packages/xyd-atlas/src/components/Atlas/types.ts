import type { Reference } from "@xyd-js/uniform";

// TODO unify MDXCommonAtlasProps and AtlasProps
export interface MDXCommonAtlasProps<T> {
    references: Reference<T>[] | []
}

export interface AtlasProps {
    references: Reference<any>[]
}