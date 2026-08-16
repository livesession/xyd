import React from "react";
import { pageMetaLayout } from "@xyd-js/framework";

/**
 * Compiled-MDX executor — copied verbatim from
 * packages/xyd-plugin-docs/src/pages/page.tsx:466-546 so the Bun dev server
 * runs the exact same runtime as the Vite/RR path.
 */

const createElementWithKeys = (type: any, props: any) => {
  const processChildren = (childrenArray: any[]): any[] => {
    return childrenArray.map((child, index) => {
      if (React.isValidElement(child) && !child.key) {
        return React.cloneElement(child, { key: `mdx-${index}` });
      }
      if (Array.isArray(child)) {
        return processChildren(child);
      }
      return child;
    });
  };

  let processedChildren;
  if (props && props.children) {
    if (Array.isArray(props.children)) {
      processedChildren = processChildren(props.children);
    } else if (React.isValidElement(props.children) && !props.children.key) {
      processedChildren = React.cloneElement(props.children, { key: "mdx-child" });
    } else {
      processedChildren = props.children;
    }
  } else {
    processedChildren = [];
  }

  return React.createElement(type, {
    ...props,
    children: processedChildren,
  });
};

function mdxExport(code: string, themeContentComponents: any, themeFileComponents: any, globalAPI: any) {
  const scope = {
    Fragment: React.Fragment,
    jsxs: createElementWithKeys,
    jsx: createElementWithKeys,
    jsxDEV: createElementWithKeys,
  };

  const global = {
    ...themeContentComponents,
    React,
  };

  const fn = new Function("_$scope", ...Object.keys(global), "fileComponents", ...Object.keys(globalAPI || {}), code);

  return fn(scope, ...Object.values(global), themeFileComponents, ...Object.values(globalAPI || {}));
}

export function mdxContent(code: string, themeContentComponents: any, themeFileComponents: any, globalAPI: any) {
  const content = mdxExport(code, themeContentComponents, themeFileComponents, globalAPI);
  if (!mdxExport) {
    return {} as any;
  }

  const layout = pageMetaLayout(content?.frontmatter);
  if (content?.frontmatter && layout) {
    content.frontmatter.layout = layout;
  }

  return {
    component: content?.default,
    toc: content?.toc,
    metadata: content?.frontmatter,
    themeSettings: content?.themeSettings || {},
    page: content?.page || false,
  };
}
