import type {Reference} from "@xyd-js/uniform";

import {MDXReference} from "@/utils/mdx";

export interface CommonAtlasProps<T> {
    references: MDXReference<Reference<T>[]> | []
}