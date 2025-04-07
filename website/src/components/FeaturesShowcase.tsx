import { useState } from 'react';
import cn from './FeaturesShowcase.module.css';
import { Grid, Section, SectionIntro, Text } from '@primer/react-brand';
import { Terminal2 } from './Terminal2';

const componentsLibraryCode = `import {
    GuideCard,
    IconSessionReplay
} from "@xyd-js/components/writer" 

 <GuideCard
    icon={<IconSessionReplay/>}
    title="Session Replay"
    kind="secondary"
>
    Visualize user interactions in your 
    product with detailed session replays.
</GuideCard>
`;

const pageRenderingCode = `import {useLoaderData} from "react-router";

import {fetchContent} from "./myFavoriteCMS"
import {Article} from "./Article"

export async function loader({request}) {
    return await fetchContent(request)
}

export default function MyCustomPge() {
    const content = useLoaderData()

    return <Article content={content}/>
}`;


const themAPICode = `import { 
    BaseTheme,
    withTheme
} from "@xyd-js/themes"
import "@xyd-js/themes/index.css"

import { MyAwesomeNavbar } from "./MyAwesomeNavbar"

import './index.css';
import './override.css';
import './vars.css';

class MyTheme extends BaseTheme {
    constructor() {
        super();
        this.toc.hide()
    }
    override Navbar() {
        return <MyAwesomeNavbar />
    }
}

export default withTheme(new MyTheme())
`

const composableArchitectureCode = `import {useLoaderData} from "react-router";

import {serverLoader} from "@xyd-js/framework"
import {
    FrameworkProvider,
    useCompileContent
} from "@xyd-js/framework/react"

import {fetchContent} from "./myFavoriteCMS"
import {MyTheme} from "./MyTheme"

import "./my-theme.css"

export async function loader({request}) {
    const frameworkProps = await serverLoader()
    const content = await fetchContent(request)

    return {
        content,
        frameworkProps,
    }
}

export default function MyCustomPage() {
    const {frameworkProps, content} = useLoaderData()
    const Content = useCompileContent(content)

    return <FrameworkProvider {...frameworkProps}>
        <MyTheme>
            <Content/>
        </MyTheme>
    </FrameworkProvider>
}`;

const features = [
    {
        id: 'components-library',
        name: 'Components library.',
        code: <Terminal2 header={false} code={componentsLibraryCode} lang="tsx" />
    },
    {
        id: 'page-rendering',
        name: 'Page rendering freedom.',
        code: <Terminal2 header={false} code={pageRenderingCode} />
    },
    {
        id: 'theme',
        name: 'Theme API for customizations.',
        code: <Terminal2 header={false} code={themAPICode} />
    },
    {
        id: 'composable-architecture',
        name: 'Composable architecture.',
        code: <Terminal2 header={false} code={composableArchitectureCode} />
    },
];

function FeaturesShowcase() {
    const [activeFeature, setActiveFeature] = useState(features[0].id);

    return (
        <Section>
            <SectionIntro align="center">
                <SectionIntro.Heading size="3">
                    Built-in framework for <br /> customizations
                </SectionIntro.Heading>
                <SectionIntro.Description>
                    Each layer of our platform is optimized<br /> to let you customize it to your needs.
                </SectionIntro.Description>
            </SectionIntro>
            <Grid>
                <Grid.Column span={{ xsmall: 12, small: 12, medium: 12, large: 6, xlarge: 6, xxlarge: 6 }}>
                    <ul className={cn.StepsList}>
                        {features.map((feature) => (
                            <li
                                key={feature.id}
                                onMouseEnter={() => setActiveFeature(feature.id)}
                                onClick={() => setActiveFeature(feature.id)}
                                role="tab"
                                aria-selected={activeFeature === feature.id}
                                tabIndex={0}
                                className={activeFeature === feature.id ? cn.Active : ''}
                            >
                                <span className={cn.Step} />
                                <span className={cn.Description}>
                                    <Text>{feature.name}</Text>
                                </span>
                            </li>
                        ))}
                    </ul>
                </Grid.Column>
                <Grid.Column span={{ xsmall: 12, small: 12, medium: 12, large: 6, xlarge: 6, xxlarge: 6 }}>
                    {features.find(f => f.id === activeFeature)?.code}
                </Grid.Column>
            </Grid>
        </Section>
    );
}

export default FeaturesShowcase; 