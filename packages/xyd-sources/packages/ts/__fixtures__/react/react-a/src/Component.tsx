import type { PropsWithChildren, ReactElement, ReactNode } from "react";

type VariantGhost = "ghost"

/**
 * The props type for {@link Component}.
 */
export interface ComponentProps extends PropsWithChildren {
    /** The theme of the card. Defaults to `primary`. */
    variant: "primary" | "secondary" | "success" | "danger" | "light" | "dark" | VariantGhost | 10
}

export interface ComponentProps2 extends PropsWithChildren {
    /** The theme of the card. Defaults to `primary`. */
    otherVariant: "other"
}

/**
 * The union type for {@link ComponentProps} and {@link ComponentProps2}.
 */
export type UnionProps = ComponentProps | ComponentProps2

// /**
//  * Component is a React component that renders a card.
//  * 
//  * @category Component
//  */
export function Component(props: UnionProps): ReactElement {
    return <div className={`card card-`}>{props.children}</div>;
}

/**
 * Component is a React component that renders a card.
 * 
 * @category Component
 */
// export function Component({ children, variant }: { children: ReactNode, variant: string }): ReactElement {
//     return <div className={`card card-${variant}`}>{children}</div>;
// }