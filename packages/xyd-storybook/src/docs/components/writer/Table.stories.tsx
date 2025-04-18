import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {
    Table
} from '@xyd-js/components/writer';

export default {
    title: 'Components/Writer/Table',
} as Meta;

export const Default = () => {
    return <div style={{
        padding: "100px",
        paddingTop: "0px",
        margin: "0 auto",
    }}>
        <Table>
        <Table.Head>
            <Table.Tr>
                <Table.Th>Model</Table.Th>
                <Table.Th numeric>Training</Table.Th>
                <Table.Th numeric>Input</Table.Th>
                <Table.Th numeric>Cached input</Table.Th>
                <Table.Th numeric>Output</Table.Th>
            </Table.Tr>
        </Table.Head>
        <Table.Body>
            <Table.Tr>
                <Table.Td>
                    <Table.Cell>gpt-4o-2024-08-06</Table.Cell>
                </Table.Td>
                <Table.Td numeric>
                    <Table.Cell>$25.00</Table.Cell>
                </Table.Td>
                <Table.Td numeric>
                    <Table.Cell>$3.75</Table.Cell>
                </Table.Td>
                <Table.Td numeric muted>
                    <Table.Cell>$1.875</Table.Cell>
                </Table.Td>
                <Table.Td numeric>
                    <Table.Cell>$15.00</Table.Cell>
                </Table.Td>
            </Table.Tr>
        </Table.Body>
    </Table>
    </div>
}

