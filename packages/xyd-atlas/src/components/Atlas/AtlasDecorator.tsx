import React from 'react'

import cn from "./AtlasDecorator.styles";

interface AtlasDecoratorProps {
    children: React.ReactNode
}

export function AtlasDecorator({ children }: AtlasDecoratorProps) {
    return <atlas-decorator
        className={cn.AtlasDecoratorHost}
    >
        {children}
    </atlas-decorator>
}
