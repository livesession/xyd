import path from "node:path";

import React from "react";
import { redirect, ScrollRestoration } from "react-router";

import { MetadataMap } from "@xyd-js/core"
import { compileBySlug } from "@xyd-js/content"
import { markdownPlugins } from "@xyd-js/content/md"
import { mapSettingsToProps } from "@xyd-js/framework/hydration";
import { Framework, FwNav, FwLink, type FwSidebarGroupProps } from "@xyd-js/framework/react";
import type { IBreadcrumb, INavLinks } from "@xyd-js/ui";
import { HomePage } from "@xyd-js/components/pages";
import { Atlas, AtlasContext } from "@xyd-js/atlas";
import { ReactContent } from "@xyd-js/components/content";
import { getMetaComponent } from "@xyd-js/context";

import settings from 'virtual:xyd-settings';
import Theme from "virtual:xyd-theme";

import "virtual:xyd-theme/index.css"
import "virtual:xyd-theme-override/index.css"
import { withTheme } from "@xyd-js/themes";

const theme = new Theme()
const themeComponents = theme.components()

const ThemeComponent = withTheme(theme)

interface loaderData {
    sidebarGroups: FwSidebarGroupProps[]
    breadcrumbs: IBreadcrumb[],
    navlinks?: INavLinks,
    toc: MetadataMap
    slug: string
    code: string
    abcCode: any
}

const mdPlugins = markdownPlugins({
    minDepth: 2, // TODO: configurable
}, settings)

const reactContent = new ReactContent(settings, {
    Link: FwLink
})
const contentComponents = {
    ...reactContent.components(),
    HomePage: (props) => <HomePage
        {...props}
        // TODO: get props from theme about nav (middle etc)
        // TODO: footer
        // TODO: style
        header={<div style={{ marginLeft: "var(--xyd-page-gutter)" }}>
            <FwNav kind="middle" />
        </div>}

    >
        {props.children}
    </HomePage>,

    Atlas: (props) => <Atlas {...props} />,

    Content: (props) => <div>{props.children}</div> // TODO: remove !!!!
}

const supportedExtensions = {
    ".mdx": true,
    ".md": true,
    "": true,
}

function getPathname(url: string) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\//, '');
}

export async function loader({ request }: { request: any }) {
    const slug = getPathname(request.url || "index") || "index"
    const ext = path.extname(slug)

    if (!supportedExtensions[ext]) {
        return {}
    }

    // TODO: in the future map instead of arr
    if (settings.redirects && settings.redirects.length) {
        for (const item of settings.redirects) {
            if (item.source === getPathname(request.url)) {
                return redirect(item.destination)
            }
        }
    }

    let code = ""
    let error: any

    try {
        code = await compileBySlug(slug, true, mdPlugins)
    } catch (e) {
        error = e
    }

    if (error?.code === "ENOENT") {
        error = null

        try {
            code = await compileBySlug(slug, false, mdPlugins)
        } catch (e) {
            error = e
        }
    }

    if (error?.code === "ENOENT") {
        try {
            // TODO: better index algorithm
            code = await compileBySlug(slug + "/index", true, mdPlugins)
        } catch (e) {
            error = e
        }
    }

    const {
        groups: sidebarGroups,
        breadcrumbs,
        navlinks,
    } = await mapSettingsToProps(
        settings,
        slug
    )

    if (error) {
        if (sidebarGroups && error.code === "ENOENT") {
            const firstItem = findFirstUrl(sidebarGroups?.[0]?.items);

            if (firstItem) {
                return redirect(firstItem)
            }
        }

        console.error(error)
    }

    const abc = getMetaComponent("atlas")

    return {
        sidebarGroups,
        breadcrumbs,
        navlinks,
        slug,
        code,
    } as loaderData
}

function findFirstUrl(items: any): string {
    const queue = [...items];

    while (queue.length > 0) {
        const item = queue.shift();

        if (item.href) {
            return item.href;
        }

        if (item.items) {
            queue.push(...item.items);
        }
    }

    return "";
}

const createElementWithKeys = (type: any, props: any) => {
    // Process children to add keys to all elements
    const processChildren = (childrenArray: any[]): any[] => {
        return childrenArray.map((child, index) => {
            // If the child is a React element and doesn't have a key, add one
            if (React.isValidElement(child) && !child.key) {
                return React.cloneElement(child, { key: `mdx-${index}` });
            }
            // If the child is an array, process it recursively
            if (Array.isArray(child)) {
                return processChildren(child);
            }
            return child;
        });
    };

    // Handle both cases: children as separate args or as props.children
    let processedChildren;

    if (props && props.children) {
        if (Array.isArray(props.children)) {
            processedChildren = processChildren(props.children);
        } else if (React.isValidElement(props.children) && !props.children.key) {
            // Single child without key
            processedChildren = React.cloneElement(props.children, { key: 'mdx-child' });
        } else {
            // Single child with key or non-React element
            processedChildren = props.children;
        }
    } else {
        processedChildren = [];
    }

    // Create the element with processed children
    return React.createElement(type, {
        ...props,
        children: processedChildren
    });
};

// TODO: move to content?
function mdxExport(code: string) {
    // Create a wrapper around React.createElement that adds keys to elements in lists

    const scope = {
        Fragment: React.Fragment,
        jsxs: createElementWithKeys,
        jsx: createElementWithKeys,
        jsxDEV: createElementWithKeys,
    }
    const fn = new Function(...Object.keys(scope), code)
    return fn(scope)
}

// // TODO: move to content?
function mdxContent(code: string) {
    const content = mdxExport(code) // TODO: fix any
    if (!mdxExport) {
        return {}
    }

    return {
        component: content?.default,
        toc: content?.toc,
        metadata: content?.frontmatter,
        themeSettings: content?.themeSettings || {},
        page: content?.page || false,
    }
}

export function MemoMDXComponent(codeComponent: any) {
    return React.useMemo(
        () => codeComponent ? codeComponent : null,
        [codeComponent]
    )
}

export default function DocsPage({ loaderData, ...rest }: { loaderData: loaderData }) {
    const content = mdxContent(loaderData.code)
    const Content = MemoMDXComponent(content.component)

    // console.log(p, 222)
    if (!Content) {
        console.error("Content not found")
        return null
    }

    let component: React.JSX.Element

    if (content.page) {
        component = <Content
            components={{
                ...contentComponents,
            }}
        />
    } else {
        component = <ThemeComponent>
            <Content
                components={{
                    ...contentComponents,
                    ...themeComponents,
                }}
            />
        </ThemeComponent>
    }

    // TODO: move `AtlasContext` to framework?
    return <AtlasContext
        value={{
            syntaxHighlight: settings?.theme?.markdown?.syntaxHighlight || null
        }}
    >
        <Framework
            settings={settings}
            sidebarGroups={loaderData.sidebarGroups || []}
            metadata={content.metadata}
            toc={content.toc || []}
            breadcrumbs={loaderData.breadcrumbs || []}
            navlinks={loaderData.navlinks}
        >
            {component}
            <ScrollRestoration />
        </Framework>
    </AtlasContext>
}
