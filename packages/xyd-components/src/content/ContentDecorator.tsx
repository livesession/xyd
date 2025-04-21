import React from 'react'

import cn from "./ContentDecoator.styles";

interface ContentDecoratorProps {
    children: React.ReactNode
    metaComponent?: string
}

export function ContentDecorator({ children, metaComponent }: ContentDecoratorProps) {
    return <xyd-content-decorator
        className={cn.ContentDecoratorHost}
        meta-component={metaComponent || undefined}
    >
        {children}
    </xyd-content-decorator>
}
