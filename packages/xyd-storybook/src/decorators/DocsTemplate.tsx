import React from "react";

import { MemoryRouter } from "react-router";

import { LayoutPrimary } from "@xyd-js/components/layouts";
import { ContentDecorator } from "@xyd-js/components/content";
import { Footer } from "@xyd-js/components/system";

import { DemoNavbar, DemoSidebar, DemoSubNav, DemoTOC } from "../components/DemoDocs";
import { Github, Linkedin, Twitter, Youtube } from "lucide-react";

interface DocsTemplateDecoratorOptions {
    toc?: boolean
}

export const DocsTemplateDecorator = ({ toc = true }: DocsTemplateDecoratorOptions) => (Story) => <MemoryRouter>
    <LayoutPrimary
        subheader={true}
        // layout={meta?.layout}
        layout="page"
        scrollKey={location.pathname}
    >
        <LayoutPrimary.Header
            // banner={banner}
            header={<DemoNavbar />}
        // subheader={<DemoSubNav />}
        />
        {/* <LayoutPrimary.MobileAside
            aside={<DemoSidebar />}
        /> */}

        <main part="main">
            {/* <aside part="sidebar"> */}
            {/* <DemoSidebar /> */}
            {/* </aside> */}

            <LayoutPrimary.Page contentNav={toc ? <DemoTOC /> : undefined}>
                <$Content>
                    {/* {children} */}
                    <Story />
                </$Content>

                {/* <$PageFooter>
                    <$BuiltWithXYD />
                </$PageFooter> */}
            </LayoutPrimary.Page>
        </main>

        <Footer
            kind="minimal"
            links={[
                {
                    label: "Trademark Policy",
                    href: "https://www.livesession.com/trademark-policy"
                },
                {
                    label: "Privacy Policy",
                    href: "https://www.livesession.com/privacy-policy"
                },
                {
                    label: "Terms of Service",
                    href: "https://www.livesession.com/terms-of-service"
                }
            ]}
            socials={[
                {
                    href: "https://www.livesession.com/github",
                    logo: <Github />
                },
                {
                    href: "https://www.livesession.com/linkedin",
                    logo: <Linkedin />
                },
                {
                    href: "https://www.livesession.com/twitter",
                    logo: <Twitter />
                },
                {
                    href: "https://www.livesession.com/youtube",
                    logo: <Youtube />
                }
            ]}
            footnote="© Livesession 2025"
        />

        {/* <$Footer /> */}
    </LayoutPrimary>
</MemoryRouter>


function $Content({ children }) {
    return <>
        {/* <$Breadcrumbs /> */}

        <ContentDecorator>
            {children}
        </ContentDecorator>

        {/* <$NavLinks /> */}
    </>
}