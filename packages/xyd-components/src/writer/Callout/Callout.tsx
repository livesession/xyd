import React from "react"

import * as cn from "./Callout.styles";

export interface CalloutProps {
    children: React.ReactNode;
}

function InfoIcon() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        fill="currentColor"
        viewBox="0 0 24 24"
    >
        <path d="M13 12a1 1 0 1 0-2 0v4a1 1 0 1 0 2 0v-4Zm-1-2.5A1.25 1.25 0 1 0 12 7a1.25 1.25 0 0 0 0 2.5Z"/>
        <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2ZM4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0Z"
            clipRule="evenodd"
        />
    </svg>
}

export function Callout({children}: CalloutProps) {
    return <div className={`${cn.CalloutHost} ${cn.CalloutNeutral}`}>
        <div className={cn.CalloutIcon}>
            <InfoIcon/>
        </div>
        <div className={cn.CalloutMessage}>
            <div className={cn.CalloutMessageBody}>
                {children}
            </div>
        </div>
    </div>
}