---
title: Tables
icon: table
layout: wide
uniform: "@components/writer/Table/Table.tsx"
---

### Examples

<<<examples
```tsx
<Table>
    <Table.Head>
        <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Description</Table.Th>
        </Table.Tr>
    </Table.Head>
    <Table.Body>
        <Table.Tr>
            <Table.Td>
                <Code>kind</Code>
            </Table.Td>
            <Table.Td>
                <Code>string</Code>
            </Table.Td>
            <Table.Td>
                Some of kind description
            </Table.Td>
        </Table.Tr>
    </Table.Body>
</Table>
```

~~~~csv
:::table
```
[
    ["Syntax", "Description", "Markdown"],
    ["Header", "Title", "`#`"],
    ["Paragraph", "Text", "`*`"]
]
```
:::
~~~~

<<<