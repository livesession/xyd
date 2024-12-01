import React from "react"
import cn from "clsx";

import {LyArticle} from "./ly-article"

export interface LyDefaultProps {
    children: JSX.Element | JSX.Element[]

    navbar: JSX.Element | JSX.Element[]

    sidebar: JSX.Element | JSX.Element[]

    navigation?: JSX.Element | JSX.Element[]

    toc?: JSX.Element | JSX.Element[]

    breadcrumbs?: JSX.Element | JSX.Element[]

    bigArticle?: boolean
}

// TODO: interface for Root (RootProps)??
export function LyDefault(Component: React.ElementType) {
    return function LyDefaultInner(props: LyDefaultProps) {
        return (
            <Component>
                {props.navbar}
                <div
                    className={cn(
                        'mx-auto flex',
                    )}
                >
                    {props.sidebar}

                    {
                        props.toc ? <nav className={cn(
                            'order-last w-64 shrink-0 xl:block print:hidden',
                            'px-4'
                        )}>
                            {props.toc}
                        </nav> : null
                    }

                    <LyArticle bigArticle={props.bigArticle}>
                        <>
                            {props.breadcrumbs}
                            {props.children}
                            {props.navigation}
                        </>
                    </LyArticle>
                </div>
            </Component>
        );
    }
}