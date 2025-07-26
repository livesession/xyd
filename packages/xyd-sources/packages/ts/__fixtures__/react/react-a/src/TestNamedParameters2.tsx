import type { ReactElement, ReactNode } from "react";


/**
 * TestNamedParameters is a React component that uses inline named parameters
 * 
 * @category Component
 */
export function TestNamedParameters2({ name, age, isActive, createdAt, children }: {
    /** The name of the person. */  
    name: string

    /** The age of the person. */
    age: number

    /** Whether the person is active. */
    isActive: boolean

    /** The date the person was created. */
    createdAt: Date

    /** The children of the component. */
    children: ReactNode
}): ReactElement {
    return <div>{children}</div>;
}
