import React from "react";

import { LayoutPrimary } from "@xyd-js/components/layouts";
import { MemoryRouter } from "react-router";

import { DemoNavbar, DemoSidebar, DemoSubNav, DemoTOC } from "../components/DemoDocs";

interface DocsTemplateDecoratorOptions {
    toc?: boolean
}

export const DocsTemplateDecorator = ({ toc = true }: DocsTemplateDecoratorOptions) => (Story) => <MemoryRouter>
    <LayoutPrimary
        header={<DemoNavbar />}
        subheader={<DemoSubNav />}
        aside={<DemoSidebar />}
        content={<>
            <Story />
        </>}
        contentNav={toc ? <DemoTOC /> : undefined}
        layoutSize="large"
    />
</MemoryRouter>