import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {CTABanner, Button} from "@xyd/components/brand";

export default {
    title: 'Components/Brand/CTABanner',
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <CTABanner>
            <CTABanner.Heading
                title="XYD"
                headingEffect
                subtitle={<>
                    Build documentation websites <br/>
                    <strong>better</strong>
                </>}
            />
            <CTABanner.ButtonGroup>
                <Button kind="secondary">
                    Quickstart
                </Button>
                <Button>
                    Github
                </Button>
            </CTABanner.ButtonGroup>
        </CTABanner>
    </div>
}

