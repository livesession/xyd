import React from 'react';

import { Badge, Text } from '@xyd-js/components/writer';
import * as cn from "./Update.styles"

interface UpdateProps {
    children: React.ReactNode

    version: string

    date?: string
}

export function Update(props: UpdateProps) {
    const { date, version, children } = props;
    return (
        <xyd-update className={cn.UpdateHost}>
            <div part="meta">
                {date && <div part="date">
                    <Badge>
                        {date}
                    </Badge>
                </div>}
                <div part="version">
                    <Text size="small">
                        {version}
                    </Text>
                </div>
            </div>
            <div part="content-container">
                <div part="content">{children}</div>
            </div>
        </xyd-update>
    );
}
