import React from "react";

import { LayoutPrimary } from "@xyd-js/components/layouts";

import { DemoNavbar, DemoSidebar, DemoSubNav, DemoTOC } from "../components/DemoDocs";

interface DocsTemplateDecoratorOptions {
    toc?: boolean
}

export const DocsTemplateDecorator = ({ toc = true }: DocsTemplateDecoratorOptions) => (Story) => <LayoutPrimary
    header={<DemoNavbar />}
    subheader={<DemoSubNav />}
    aside={<DemoSidebar />}
    content={<>
        <Story />
    </>}
    contentNav={toc ? <DemoTOC /> : undefined}
    layoutSize="large"
/>