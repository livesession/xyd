import type { Reference } from "@xyd-js/uniform";

import { MDXReference } from "@/utils/mdx";

// TODO unify MDXCommonAtlasProps and AtlasProps
export interface MDXCommonAtlasProps<T> {
    references: MDXReference<Reference<T>[]> | []
}

export interface AtlasProps {
    references: Reference<any>[]
}