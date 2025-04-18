import React from 'react'

import cn from "./GridDecorator.styles";

export function GridDecorator({children}: { children: React.ReactNode }) {
    return <xyd-grid-decorator className={cn.GridDecoratorHost}>
        {children}
    </xyd-grid-decorator>
}
