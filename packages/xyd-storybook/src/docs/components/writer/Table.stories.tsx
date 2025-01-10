import React, {} from 'react';
import type {Meta} from '@storybook/react';

import {
    Table,
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
}
