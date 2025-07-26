import React from 'react'

import cn from "./GridDecorator.styles";

export interface GridDecoratorProps {
    children: React.ReactNode
    cols?: 2 | 3 | 4 | 5 | 6
}

/**
 * A wrapper component that applies grid decoration styling to its children.
 * This component uses a custom element `xyd-grid-decorator` to provide grid-based layout decoration.
 *
 * @category Component
 */
export function GridDecorator({ children, cols }: GridDecoratorProps) {
    return <xyd-grid-decorator
        className={cn.GridDecoratorHost}
        data-cols={cols}
    >
        {children}
    </xyd-grid-decorator>
}
