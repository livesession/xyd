import path from "node:path";

import * as React from "react";
import { redirect, ScrollRestoration } from "react-router";

import { MetadataMap, Settings, Theme as ThemeSettings } from "@xyd-js/core"
import { compileBySlug } from "@xyd-js/content"
import { markdownPlugins } from "@xyd-js/content/md"
import { mapSettingsToProps } from "@xyd-js/framework/hydration";
import { Framework, FwNav, FwLink, type FwSidebarGroupProps } from "@xyd-js/framework/react";
import type { IBreadcrumb, INavLinks } from "@xyd-js/ui";
import { HomePage } from "@xyd-js/components/pages";
import { Atlas, AtlasContext } from "@xyd-js/atlas";
import { ReactContent } from "@xyd-js/components/content";
import { withTheme } from "@xyd-js/themes";

import settings from 'virtual:xyd-settings';
import Theme from "virtual:xyd-theme";

import "virtual:xyd-theme/index.css"
import "virtual:xyd-theme-override/index.css"

const surfaces = {} // TODO: BETTER API !!!

const theme = new Theme(
    settings.theme || {} as ThemeSettings,
    surfaces
);
const themeComponents = theme.components();

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

interface loaderData {
    sidebarGroups: FwSidebarGroupProps[]
    breadcrumbs: IBreadcrumb[],
    navlinks?: INavLinks,
    toc: MetadataMap
    slug: string
    code: string
}

export async function loader({ request }: { request: any }) {
    console.log('loader: starting');
    console.time('loader:total');
    const slug = getPathname(request.url || "index") || "index"
    console.log(`loader: processing slug: ${slug}`);
    const ext = path.extname(slug)
    console.log(`loader: file extension: ${ext}`);

    if (!supportedExtensions[ext]) {
        console.log(`loader: unsupported extension ${ext}, returning empty object`);
        console.timeEnd('loader:total');
        return {}
    }

    // TODO: in the future map instead of arr
    if (settings.redirects && settings.redirects.length) {
        console.log(`loader: checking ${settings.redirects.length} redirects`);
        for (const item of settings.redirects) {
            const pathname = getPathname(request.url)
            if (item.source === pathname) {
                console.log(`loader: redirecting from ${item.source} to ${item.destination}`);
                console.timeEnd('loader:total');
                return redirect(item.destination)
            }
        }
    }

    let code = ""
    let error: any

    console.time('loader:compile');
    console.log('loader: starting compilation process');
    console.time('loader:compile:withPlugins');
    console.log('loader: attempting to compile with plugins');
    try {
        code = await compileBySlug(slug, true, mdPlugins)
        console.log('loader: compilation successful with plugins');
    } catch (e) {
        error = e
        console.log(`loader: compilation with plugins failed: ${e.message}`);
    }
    console.timeEnd('loader:compile:withPlugins');

    if (error?.code === "ENOENT") {
        error = null
        console.log('loader: attempting compilation without plugins');
        console.time('loader:compile:withoutPlugins');
        try {
            code = await compileBySlug(slug, false, mdPlugins)
            console.log('loader: compilation successful without plugins');
        } catch (e) {
            error = e
            console.log(`loader: compilation without plugins failed: ${e.message}`);
        }
        console.timeEnd('loader:compile:withoutPlugins');
    }

    if (error?.code === "ENOENT") {
        console.log('loader: attempting compilation with index fallback');
        console.time('loader:compile:indexFallback');
        try {
            // TODO: better index algorithm
            code = await compileBySlug(slug + "/index", true, mdPlugins)
            console.log('loader: compilation successful with index fallback');
        } catch (e) {
            error = e
            console.log(`loader: compilation with index fallback failed: ${e.message}`);
        }
        console.timeEnd('loader:compile:indexFallback');
    }
    console.timeEnd('loader:compile');

    console.time('loader:mapSettings');
    console.log('loader: mapping settings to props');
    const {
        groups: sidebarGroups,
        breadcrumbs,
        navlinks,
        hiddenPages
    } = await mapSettingsToProps(
        settings,
        slug,
    )
    console.log(`loader: mapped settings - found ${sidebarGroups?.length || 0} sidebar groups, ${breadcrumbs?.length || 0} breadcrumbs`);
    console.timeEnd('loader:mapSettings');

    if (hiddenPages?.[slug]) {
        const firstItem = findFirstUrl(sidebarGroups?.[0]?.items);

        return redirect(firstItem)
    }

    if (error) {
        console.log(`loader: handling error: ${error.message}`);
        if (sidebarGroups && error.code === "ENOENT") {
            const firstItem = findFirstUrl(sidebarGroups?.[0]?.items);

            if (firstItem) {
                console.log(`loader: redirecting to first available URL: ${firstItem}`);
                console.timeEnd('loader:total');
                return redirect(firstItem)
            }
        }

        console.error(error)
    }

    console.log('loader: completed successfully');
    console.timeEnd('loader:total');
    return {
        sidebarGroups,
        breadcrumbs,
        navlinks,
        slug,
        code,
    } as loaderData
}

function findFirstUrl(items: any = []): string {
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

    if (!Content) {
        console.error("Content not found")
        return null
    }

    const ThemeComponent = withTheme(theme);

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
            surfaces={surfaces}
        >
            {component}
            <ScrollRestoration />
        </Framework>
    </AtlasContext>
}
