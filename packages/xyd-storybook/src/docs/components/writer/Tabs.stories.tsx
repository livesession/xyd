import React, { } from 'react';
import type { Meta } from '@storybook/react';

import {
    Tabs,
} from '@xyd-js/components/writer';

export default {
    title: 'Components/Writer/Tabs',
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <Tabs items={["User Behavior", "Feature Adoption", "Churn Analysis", "Churn Analysis2", "Churn Analysis3", "Churn Analysis4", "Churn Analysis5", "Churn Analysis6"]}>
            <Tabs.Content value="User Behavior">
                Gain insights into user behavior by replaying sessions and analyzing click patterns. This helps uncover friction
                points in your app's user experience.
            </Tabs.Content>
            <Tabs.Content value="Feature Adoption">
                Understand how users engage with new features. Track metrics like time to adoption and overall usage to measure
                feature success.
            </Tabs.Content>
            <Tabs.Content value="Churn Analysis">
                Use session data to identify behavioral patterns of users who are at risk of churning and implement targeted
                retention strategies.
            </Tabs.Content>
            <Tabs.Content value="Churn Analysis2">
                Use session data to identify behavioral patterns of users who are at risk of churning and implement targeted
                retention strategies.
            </Tabs.Content>
            <Tabs.Content value="Churn Analysis3">
                Use session data to identify behavioral patterns of users who are at risk of churning and implement targeted
                retention strategies.
            </Tabs.Content>
            <Tabs.Content value="Churn Analysis4">
                Use session data to identify behavioral patterns of users who are at risk of churning and implement targeted
                retention strategies.
            </Tabs.Content>
            <Tabs.Content value="Churn Analysis5">
                Use session data to identify behavioral patterns of users who are at risk of churning and implement targeted
                retention strategies.
            </Tabs.Content>
            <Tabs.Content value="Churn Analysis6">
                Use session data to identify behavioral patterns of users who are at risk of churning and implement targeted
                retention strategies.
            </Tabs.Content>
        </Tabs>
    </div>
}


