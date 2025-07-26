"use client"

import {Text} from "@primer/react-brand";

import cn from "./Terminal.module.css";

interface TerminalProps {
    header?: boolean;
    children?: React.ReactNode;
}

export function Terminal({header = true, children}: TerminalProps) {
    return <div
        className={cn.Editor}
        aria-hidden="true"
    >
        {
            header && <div className={cn.EditorHeading}>
                <Text className={cn.Selected}>
                    Terminal
                </Text>
            </div>
        }
        <div className={cn.EditorContent}>
            {children}
        </div>
    </div>;
}