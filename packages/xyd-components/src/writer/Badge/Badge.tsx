import React from "react"
import * as cn from "./Badge.styles";

export interface BadgeProps {
    className?: string;
    children?: React.ReactNode;

    size?: "sm"
    kind?: "warning" | "info"
}

export function Badge({
                          className,
                          children,
                          size = "sm",
                          kind = "warning"
                      }: BadgeProps) {
    return <div className={`
        ${cn.BadgeHost}
        
        ${size === "sm" && cn.BadgeHostSm}
        
        ${kind === "warning" && cn.BadgeHostWarning}
        
        ${kind === "info" && cn.BadgeHostInfo}
        
        ${className || ''}
    `}>
        <span className={cn.BadgeItem}>
            {children}
        </span>
    </div>
}

// TODO: below is a concept only
// Export styles for useStyle hook
// Badge.styles = cn;
// export type BadgeStyles = typeof cn;

// Example usage:
/*
import { useStyle } from '@xyd/components/utils';
import { Badge, BadgeStyles } from '@xyd/components/writer';

const styled = useStyle<BadgeStyles>(Badge);

styled.BadgeHost`
    background-color: red;
`;
*/

// usage

// import {Content} from "@xyd-js/components/writer"
// const styled = useStyle(Badge)

// styled.BadgeHostInfo`
//     background-color: red;
// `

// export default styled