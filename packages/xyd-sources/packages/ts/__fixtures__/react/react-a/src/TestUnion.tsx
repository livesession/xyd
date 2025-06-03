import type { PropsWithChildren, ReactElement, ReactNode } from "react";

type VariantGhost = "ghost"

/**
 * The props type for {@link TestUnionComponent}.
 */
export interface ComponentProps extends PropsWithChildren {
    /** The theme of the card. Defaults to `primary`. */
    variant: "primary" | "secondary" | "success" | "danger" | "light" | "dark" | VariantGhost | 10
}

export interface ComponentProps2 extends PropsWithChildren {
    /** The theme of the card. Defaults to `primary`. */
    otherVariant: "other"

    label: string
}

/**
 * The union type for {@link ComponentProps} and {@link ComponentProps2}.
 */
export type UnionProps = ComponentProps | ComponentProps2

/**
 * TestUnionComponent is a React component that uses a union type for its props.
 * 
 * @category Component
 */
export function TestUnionComponent(props: UnionProps): ReactElement {
    return <div>{props.children}</div>;
}
