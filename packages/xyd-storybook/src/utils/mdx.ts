import React from "react";

export type MDXReferenceWrapper<T> = {
    children: React.ReactNode;
    title: string;
};

export type MDXReference<T> = T extends object
    ? MDXReferenceWrapper<T> & {
    [K in keyof T]: MDXReference<T[K]>;
}
    : MDXReferenceWrapper<T>;

// TODO: unify xyd reference props with react
export function mdxValue<T>(val: MDXReferenceWrapper<T> | null): string {
    if (!val) {
        return ""
    }

    if (val.title) {
        return val.title
    }

    // if we have case like below
    /*
        #### !!<key> <name>

        !<key> string
    */
    return val as unknown as string
}
