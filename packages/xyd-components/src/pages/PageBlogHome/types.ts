export interface BlogPostAuthor {
    name: string;
    avatar: string;
}

export interface BlogPost {
    id: number;
    title: string;
    image: string;
    tag: string;
    author: BlogPostAuthor;
    date: string;
    href: string;
}

export interface BlogTab {
    value: string;
    label: string;
    href?: string;
}

export interface BlogPaginationLink {
    title: string;
    href: string;
}

export interface PageBlogHomeProps {
    posts: BlogPost[];
    tabs: BlogTab[];
    initialTab?: string;
    heading?: string;
    subheading?: string;
    prevLink?: BlogPaginationLink;
    nextLink?: BlogPaginationLink;
} 