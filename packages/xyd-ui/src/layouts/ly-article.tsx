import React from "react";
import cn from "clsx";
import {tv} from "tailwind-variants";

function styled() {
}

styled.article = tv({
    slots: {
        article: cn('w-full break-words'),
        body: cn(
            "w-full min-w-0 px-6 pt-4 md:px-12"
        )
    },
    variants: {
        bigBody: {
            true: {
                body: "max-w-6xl"
            },
            false: {
                body: "max-w-4xl"
            }
        },
        full: {
            true: {
                article: cn(
                    'xyd-content min-h-[calc(100vh-var(--xyd-navbar-height))] pl-[max(env(safe-area-inset-left),1rem)] pr-[max(env(safe-area-inset-right),1rem)]'
                )
            },
            false: {
                article: cn(
                    "xyd-content flex min-h-[calc(100vh-var(--xyd-navbar-height))] min-w-0 justify-center pb-8 pr-[calc(env(safe-area-inset-right)-1.5rem)]"
                )
            }
        },
        typesettingArticle: {
            true: {
                article: cn(
                    'xyd-body-typesetting-article'
                )
            }
        }
    },
})

export interface LyArticleProps {
    children: JSX.Element | JSX.Element[]

    raw?: boolean

    full?: boolean

    bigArticle?: boolean
}

export function LyArticle(props: LyArticleProps) {
    const {article, body} = styled.article()

    if (props.raw) {
        return <div className={article()}>{props.children}</div>
    }

    if (props.full) {
        return (
            <article className={article({full: true})}>
                {props.children}
            </article>
        )
    }

    return (
        <article className={article({full: false, typesettingArticle: true})}>
            <main className={body({bigBody: props.bigArticle})}>
                {props.children}
            </main>
        </article>
    )
}