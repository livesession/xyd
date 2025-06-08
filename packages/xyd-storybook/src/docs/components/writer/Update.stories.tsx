import { Meta, StoryObj } from '@storybook/react';

import { ContentDecorator } from '@xyd-js/components/content';
import { Heading, Image, List, Text, Update } from '@xyd-js/components/writer';

const meta: Meta<typeof Update> = {
    title: 'Components/Writer/Update',
    component: Update,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: '',
            },
        },
    },
    tags: [],
};

export default meta;
type Story = StoryObj<typeof Update>;

export const Default: Story = {
    args: {
        date: '2024-10-12',
        version: 'v0.1.1',
        features: [
            'Responsive design',
            'Sticky section for each changelog',
        ],
        children: <ContentDecorator>
            <Image
                src="https://placehold.co/600x300?text=Screenshot+or+Content"
                alt="Screenshot placeholder"
            />
            <Heading size={2}>
                Changelog
            </Heading>
            <Text>
                You can add anything here, like a screenshot, a code snippet, or a list of changes.
            </Text>

            <Heading size={3}>
                Features
            </Heading>
            <List>
                <List.Item>Initial layout</List.Item>
                <List.Item>Basic navigation</List.Item>
            </List>
        </ContentDecorator>,
    },
};

export const MultipleUpdates: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', alignItems: 'stretch' }}>
            <Update date="2024-10-12" version="v0.1.1">
                <ContentDecorator>
                    <Image
                        src="https://placehold.co/600x300?text=Screenshot+or+Content+1"
                        alt="Screenshot 1"
                    />
                    <Heading size={2}>Changelog</Heading>
                    <Text>First update: new features and improvements.</Text>
                    <Heading size={3}>Features</Heading>
                    <List>
                        <List.Item>Initial layout</List.Item>
                        <List.Item>Basic navigation</List.Item>
                    </List>
                </ContentDecorator>
            </Update>
            <Update date="2024-09-01" version="v0.1.0">
                <ContentDecorator>
                    <Image
                        src="https://placehold.co/600x300?text=Screenshot+or+Content+2"
                        alt="Screenshot 2"
                    />
                    <Heading size={2}>Changelog</Heading>
                    <Text>Initial release with basic functionality.</Text>
                    <Heading size={3}>Features</Heading>
                    <List>
                        <List.Item>Initial layout</List.Item>
                        <List.Item>Basic navigation</List.Item>
                    </List>
                </ContentDecorator>
            </Update>
        </div>
    ),
};


