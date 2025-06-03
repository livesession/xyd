import type { PropsWithChildren, ReactElement, ReactNode } from "react";

/**
 * The props type for {@link TestBasicComponent}.
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
 * TestBasicComponent is a React component that uses a basic props type.
 * 
 * @category Component
 */
export function TestBasicComponent(props: Props): ReactElement {
    return <div>{props.children}</div>;
}
