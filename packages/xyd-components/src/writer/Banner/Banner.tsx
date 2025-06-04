import React from "react";

import * as cn from "./Banner.styles";

// TODO: move to system?

export interface BannerProps {
    children: React.ReactNode;
}

export function Banner(props: BannerProps) {
    return <xyd-banner className={cn.BannerHost}>
        {props.children}
    </xyd-banner>

}