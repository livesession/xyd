import { FileIcon } from '@primer/octicons-react'
import { ThemeProvider, BaseStyles, TreeView } from '@primer/react'

import type { GitHubTreeItem } from '~/services/github'

interface EditorTreeViewProps {
    treeItems: GitHubTreeItem[]
    onFileSelect: (filePath: string) => void
    selectedFile?: string
}

export function EditorTreeView({ treeItems, onFileSelect, selectedFile }: EditorTreeViewProps) {
    return <ThemeProvider>
        <BaseStyles>
            <_TreeView
                treeItems={treeItems}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
            />
        </BaseStyles>
    </ThemeProvider>
}

interface _TreeViewProps {
    treeItems: GitHubTreeItem[]
    onFileSelect: (filePath: string) => void
    selectedFile?: string
}

function _TreeView({ treeItems, onFileSelect, selectedFile }: _TreeViewProps) {
    // Build a tree structure from the flat list of items, preserving GitHub order
    const buildTree = (items: GitHubTreeItem[]) => {
        const tree: { [key: string]: any } = {}
        const orderMap: { [key: string]: string[] } = {} // Track order of children

        items.forEach(item => {
            const pathParts = item.path.split('/')
            let current = tree
            let currentPath = ''

            pathParts.forEach((part, index) => {
                const parentPath = currentPath
                currentPath = currentPath ? `${currentPath}/${part}` : part

                if (!current[part]) {
                    current[part] = {
                        type: index === pathParts.length - 1 ? item.type : 'tree',
                        children: {},
                        path: item.path,
                        sha: item.sha
                    }

                    // Track the order of this item under its parent
                    if (!orderMap[parentPath]) {
                        orderMap[parentPath] = []
                    }
                    if (!orderMap[parentPath].includes(part)) {
                        orderMap[parentPath].push(part)
                    }
                }
                current = current[part].children
            })
        })

        return { tree, orderMap }
    }

    const renderTreeItems = (tree: any, orderMap: any, basePath: string = '') => {
        // Get the ordered list of children for this path
        const orderedChildren = orderMap[basePath] || Object.keys(tree)

        // Sort to ensure directories come before files (GitHub convention)
        const sortedChildren = orderedChildren.sort((a: string, b: string) => {
            const itemA = tree[a]
            const itemB = tree[b]

            // If both are directories or both are files, maintain original order
            if (itemA.type === itemB.type) {
                return 0
            }

            // Directories come before files
            if (itemA.type === 'tree') return -1
            if (itemB.type === 'tree') return 1

            return 0
        })

        return sortedChildren.map((name: string) => {
            const item = tree[name]
            if (!item) return null

            const fullPath = basePath ? `${basePath}/${name}` : name
            const isSelected = selectedFile === item.path

            if (item.type === 'tree') {
                const hasChildren = Object.keys(item.children).length > 0

                return (
                    <TreeView.Item key={item.path} id={item.path}>
                        <TreeView.LeadingVisual>
                            <TreeView.DirectoryIcon />
                        </TreeView.LeadingVisual>
                        {name}
                        {hasChildren && (
                            <TreeView.SubTree>
                                {renderTreeItems(item.children, orderMap, fullPath)}
                            </TreeView.SubTree>
                        )}
                    </TreeView.Item>
                )
            } else {
                return (
                    <TreeView.Item
                        key={item.path}
                        id={item.path}
                        current={isSelected}
                        onSelect={() => onFileSelect(item.path)}
                    >
                        <TreeView.LeadingVisual>
                            <FileIcon />
                        </TreeView.LeadingVisual>
                        {name}
                    </TreeView.Item>
                )
            }
        }).filter(Boolean)
    }

    const { tree, orderMap } = buildTree(treeItems)

    return (
        <TreeView aria-label="Repository files">
            {renderTreeItems(tree, orderMap)}
        </TreeView>
    )
}