import React from "react"

import {$layout, $page, $article} from "./Layout.styles"

export interface LayoutProps {
    header: React.ReactNode;
    aside: React.ReactNode;
    content: React.ReactNode;
    contentNav: React.ReactNode;
}

export function Layout(props: LayoutProps) {
    return <div className={$layout.host}>
        <header className={$layout.header}>
            {props.header}
        </header>
        <main className={$layout.main}>
            <aside className={$layout.sidebar}>
                {props.aside}
            </aside>
            <div className={$page.host}>
                <div className={$page.scroll}>
                    <div className={$page.container}>
                        <div className={$page.articleContainer}>
                            <article className={$article.host}>
                                <section className={$article.content}>
                                    {props.content}
                                </section>
                                <nav lang={$article.nav}>
                                    {props.contentNav}
                                </nav>
                            </article>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
}