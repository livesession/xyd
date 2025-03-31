import React from "react";
import * as cn from "./Footer.styles";

export interface FooterProps {
    children?: React.ReactNode
}

export function Footer({children}: FooterProps) {
    return <footer className={cn.FooterHost}>
        <div className={cn.FooterContainer}>
            <div className={cn.FooterTextContainer}>
                {children}
            </div>
        </div>
    </footer>
}
