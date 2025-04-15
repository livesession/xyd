import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {
    TableV2
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
        <TableV2>
        <TableV2.Head>
            <TableV2.Tr>
                <TableV2.Th>Model</TableV2.Th>
                <TableV2.Th numeric>Training</TableV2.Th>
                <TableV2.Th numeric>Input</TableV2.Th>
                <TableV2.Th numeric>Cached input</TableV2.Th>
                <TableV2.Th numeric>Output</TableV2.Th>
            </TableV2.Tr>
        </TableV2.Head>
        <TableV2.Body>
            <TableV2.Tr>
                <TableV2.Td>
                    <TableV2.Cell>gpt-4o-2024-08-06</TableV2.Cell>
                </TableV2.Td>
                <TableV2.Td numeric>
                    <TableV2.Cell>$25.00</TableV2.Cell>
                </TableV2.Td>
                <TableV2.Td numeric>
                    <TableV2.Cell>$3.75</TableV2.Cell>
                </TableV2.Td>
                <TableV2.Td numeric muted>
                    <TableV2.Cell>$1.875</TableV2.Cell>
                </TableV2.Td>
                <TableV2.Td numeric>
                    <TableV2.Cell>$15.00</TableV2.Cell>
                </TableV2.Td>
            </TableV2.Tr>
        </TableV2.Body>
    </TableV2>
    </div>
}

