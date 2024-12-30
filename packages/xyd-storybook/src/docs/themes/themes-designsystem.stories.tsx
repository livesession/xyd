import React, {useState} from 'react';
import type {Meta} from '@storybook/react';

import {
    Callout,
    Code,
    Details,
    Hr,
    Pre,
    Steps,
    Table,
    Tabs,
    UnderlineNav,
} from '@xyd/components/writer';
import {getComponents} from "@xyd/components/mdx";

const {
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    h5: H5,
    h6: H6,

    p: Text,

    ul: Ul,
    ol: Ol,
    li: Li,
} = getComponents()

export default {
    title: 'Themes',
} as Meta;

export const DesignSystem = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <$Hero/>
        {/*<$OverviewTabView/>*/}
        <$ReactTabView/>
    </div>
}

function $Hero() {
    return <>
        <>
            <H1>Section intro</H1>
            <H4>
                Use the section intro component to provide
                a title, optional description and link to a new section in the page.
            </H4>
        </>

        <$Nav/>
    </>
}


function $Nav() {
    const [activeTab, setActiveTab] = useState("overview")

    return <UnderlineNav value={activeTab} onChange={setActiveTab}>
        <UnderlineNav.Item value="overview" href="#">
            Overview
        </UnderlineNav.Item>
        <UnderlineNav.Item value="react" href="#">
            React
        </UnderlineNav.Item>
        <UnderlineNav.Item value="figma" href="#">
            Figma
        </UnderlineNav.Item>
    </UnderlineNav>
}


function $OverviewTabView() {
    return <>
        <>
            <H3>Anatomy</H3>
            <Hr/>
        </>

        <>
            <H3>Usage</H3>
            <Hr/>

            <Text>
                Use the section intro to introduce a new section element in the page. The section intro uses the
                full-width of the screen and can be used in conjunction with other components that expand the content
                introduced. For example, the card or the pillar components.

                We recommmend using the section intro as a header of an HTML element. Sections divide the
                content of the page into thematic groups and represent standalone elements that are typically related to
                a specific topic or subject within the document.

                Sections are designed to be self-contained, meaning they should make sense and be meaningful even when
                viewed independently from the rest of the page. They provide a way to divide the content into meaningful
                and structured blocks.

                Ensure the description is concise, keeping it to one paragraph. Use a link to direct users to a page
                with further details if needed.
            </Text>
        </>

        <>
            <H3>Options</H3>
            <Hr/>
        </>

        <>
            <H3>Related components</H3>
            <Hr/>
        </>
    </>
}

function $ReactTabView() {
    return <div style={{marginTop: 10, display: "flex", flexDirection: "column", gap: "25px"}}>
        <div>
            <H3>Import</H3>
            <Pre>
                {`import {Pre} from '@xyd/components/writer'`}
            </Pre>
        </div>

        <div>
            <H3>Props</H3>
            <Table>
                <Table.Th>
                    Name
                </Table.Th>
                <Table.Th>
                    Default
                </Table.Th>
                <Table.Th>
                    Description
                </Table.Th>

                <Table.Tr>
                    <Table.Td>
                        disabled
                    </Table.Td>
                    <Table.Td>
                        false
                    </Table.Td>
                    <Table.Td>
                        Controls the disabled state of the tab
                    </Table.Td>
                </Table.Tr>

                <Table.Tr>
                    <Table.Td>
                        active
                    </Table.Td>
                    <Table.Td>
                        false
                    </Table.Td>
                    <Table.Td>
                        Controls the active state of the tab
                    </Table.Td>
                </Table.Tr>
            </Table>
        </div>
    </div>
}