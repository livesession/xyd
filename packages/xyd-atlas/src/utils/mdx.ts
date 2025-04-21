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
export function uniformValue<T>(val: MDXReferenceWrapper<T> | string | null): string {
    if (!val) {
        return ""
    }

    if (typeof val === "string") {
        return val
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


export function uniformChild<V extends MDXReferenceWrapper<V>>(v: V) {
    if (v.children) {
        return v.children
    }

    if (React.isValidElement(v)) {
        return v
    } else if (typeof v === "object") {
        return null
    }
   
    return v
}
