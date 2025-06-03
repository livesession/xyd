import React from 'react'

import cn from "./GridDecorator.styles";

/**
 * A wrapper component that applies grid decoration styling to its children.
 * This component uses a custom element `xyd-grid-decorator` to provide grid-based layout decoration.
 * 
 * @category Component
 */
export function GridDecorator({ children }: { children: React.ReactNode }) {
    return <xyd-grid-decorator className={cn.GridDecoratorHost}>
        {children}
    </xyd-grid-decorator>
}
