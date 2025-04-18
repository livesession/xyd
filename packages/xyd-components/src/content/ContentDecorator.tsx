import React from 'react'

import cn from "./ContentDecoator.styles";

export function ContentDecorator({children}: { children: React.ReactNode }) {
    return <xyd-content-decorator className={cn.ContentDecoratorHost}>
        {children}
    </xyd-content-decorator>
}
