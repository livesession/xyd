import type { PropsWithChildren, ReactElement, ReactNode } from "react";

/**
 * The props type for {@link TestNamedParameters}.
 */
export interface Props extends PropsWithChildren {
    /** The name of the person. */
    name: string

    /** The age of the person. */
    age: number

    /** Whether the person is active. */
    isActive: boolean

    /** The date the person was created. */
    createdAt: Date
}

/**
 * TestNamedParameters is a React component that uses a named parameters.
 * 
 * @category Component
 */
export function TestNamedParameters({ name, age, isActive, createdAt, children }: Props): ReactElement {
    return <div>{children}</div>;
}
