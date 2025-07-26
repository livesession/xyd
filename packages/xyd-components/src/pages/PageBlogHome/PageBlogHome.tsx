import * as React from "react"

import { Heading, NavLinks, Tabs, GuideCard, Text } from "../../writer"

import * as cn from "./PageBlogHome.styles"
import { PageBlogHomeProps, BlogPost, BlogTab } from "./types"

export function PageBlogHome({
    posts = [],
    tabs = [],
    initialTab,
    heading,
    subheading,
    prevLink,
    nextLink,
    as = "",
}: PageBlogHomeProps) {
    const [tab, setTab] = React.useState(initialTab || (tabs && tabs[0]?.value) || "")

    const filteredPosts = React.useMemo(() => {
        if (tab === "everything") return posts
        return posts?.filter(post => post.tag.toLowerCase() === tab)
    }, [tab, posts])

    return <page-blog-home className={cn.PageBlogHome}>
        <Heading size={1} subtitle={subheading}>{heading}</Heading>
        <Tabs value={tab} onChange={setTab}>
            {tabs.map(t => (
                <Tabs.Item as={as} href={t.href} value={t.value}>{t.label}</Tabs.Item>
            ))}
        </Tabs>
        <div part="posts">
            {filteredPosts.map(post => (
                <GuideCard
                    key={post.id}
                    href={post.href}
                    kind="secondary"
                    size="md"
                >
                    <div part="card-content">
                        <div part="card-image">
                            <img src={post.image} alt={post.title} />
                        </div>
                        <Text size="small" kind="primary" as="span">{post.tag}</Text>
                        <GuideCard.Title>
                            <Text size="large" weight="bold" as="span">{post.title}</Text>
                        </GuideCard.Title>
                        <div part="card-author-row">
                            <img src={post.author.avatar} alt={post.author.name} part="card-author-avatar" />
                            <Text size="small" as="span">{post.author.name}</Text>
                            <Text size="small" kind="secondary" as="span">{post.date}</Text>
                        </div>
                    </div>
                </GuideCard>
            ))}
        </div>
        <div part="pagination">
            <NavLinks
                prev={prevLink}
                next={nextLink}
            />
        </div>
    </page-blog-home>
}