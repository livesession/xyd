export interface FileNode {
  id: string;
  name: string;
  displayName: string;
  type: 'file' | 'folder';
  fileType?: 'markdown' | 'json' | 'yaml' | 'typescript';
  icon?: string;
  content?: string;
  children?: FileNode[];
  // Navigation metadata
  navigationGroup?: string;
  navigationTab?: string;
  navigationOrder?: number;
}

// SINGLE SOURCE OF TRUTH: File Tree Structure
export const FILE_TREE: FileNode[] = [
  {
    id: 'introduction',
    name: 'introduction',
    displayName: 'Introduction',
    type: 'file',
    fileType: 'markdown',
    icon: 'FileText',
    navigationTab: 'docs',
    navigationGroup: 'getting-started',
    navigationOrder: 1,
    content: `# Introduction

\`Welcome\`
## Heading2 
- list item

Welcome to the documentation!

This is a sample markdown file to demonstrate the editor capabilities.
You can edit this content and see the changes reflected in real-time.

## Features

- **Monaco Editor**: Powerful code editing experience.
- **Tailwind CSS**: Beautiful and consistent styling.
- **Files Mode**: Navigate through your project files.

\`\`\`js
console.log(5)
\`\`\`

:::callout
Example callout
:::
`
  },
  {
    id: 'quickstart',
    name: 'quickstart',
    displayName: 'Quickstart',
    type: 'file',
    fileType: 'markdown',
    icon: 'Zap',
    navigationTab: 'docs',
    navigationGroup: 'getting-started',
    navigationOrder: 2,
    content: `# Quickstart

Get started in minutes.

\`\`\`bash
npm install @documentation-ai/core
\`\`\`
`
  },
  {
    id: 'guides',
    name: 'guides',
    displayName: 'guides',
    type: 'folder',
    children: [
      {
        id: 'guides/organizing-documentation',
        name: 'guides/organizing-documentation',
        displayName: 'Organizing Documentation',
        type: 'file',
        fileType: 'markdown',
        icon: 'Folder',
        navigationTab: 'docs',
        navigationGroup: 'guides',
        navigationOrder: 1,
        content: `# Organizing Documentation

Learn how to structure your docs.
`
      },
      {
        id: 'guides/configuration',
        name: 'guides/configuration',
        displayName: 'Configuration',
        type: 'file',
        fileType: 'markdown',
        icon: 'Settings',
        navigationTab: 'docs',
        navigationGroup: 'guides',
        navigationOrder: 2,
        content: `# Configuration

Configure your documentation site.

\`\`\`json
{
  "title": "My Docs",
  "theme": "light"
}
\`\`\`
`
      },
      {
        id: 'guides/advanced',
        name: 'guides/advanced',
        displayName: 'advanced',
        type: 'folder',
        children: [
          {
            id: 'guides/advanced/custom-themes',
            name: 'guides/advanced/custom-themes',
            displayName: 'Custom Themes',
            type: 'file',
            fileType: 'markdown',
            icon: 'FileText',
            content: `# Custom Themes

Learn how to create custom themes for your documentation.
`
          },
          {
            id: 'guides/advanced/plugins',
            name: 'guides/advanced/plugins',
            displayName: 'Plugins',
            type: 'file',
            fileType: 'markdown',
            icon: 'FileText',
            content: `# Plugins

Extend functionality with plugins.
`
          }
        ]
      }
    ]
  },
  {
    id: 'changelog',
    name: 'changelog',
    displayName: 'Changelog',
    type: 'file',
    fileType: 'markdown',
    icon: 'Clock',
    navigationTab: 'changelog',
    navigationGroup: 'releases',
    navigationOrder: 1,
    content: `# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-01-01

- Initial release
`
  },
  {
    id: 'documentation.json',
    name: 'documentation.json',
    displayName: 'documentation.json',
    type: 'file',
    fileType: 'json',
    content: `{
  "name": "My Documentation",
  "version": "1.0.0",
  "private": true
}
`
  },
  {
    id: 'openapi.yaml',
    name: 'openapi.yaml',
    displayName: 'openapi.yaml',
    type: 'file',
    fileType: 'yaml',
    content: `openapi: 3.0.0
info:
  title: Sample API
  version: 0.1.9
`
  }
];

// ============================================================================
// TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Extract file contents from tree into a flat map
 */
export function getFileContents(tree: FileNode[] = FILE_TREE): Record<string, string> {
  const contents: Record<string, string> = {};
  
  function traverse(nodes: FileNode[]) {
    for (const node of nodes) {
      if (node.content) {
        contents[node.name] = node.content;
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(tree);
  return contents;
}

/**
 * Get flat file list for FilesPanel
 */
export function getFlatFileList(tree: FileNode[] = FILE_TREE): FileNode[] {
  const files: FileNode[] = [];
  
  function traverse(nodes: FileNode[]) {
    for (const node of nodes) {
      files.push(node);
      if (node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(tree);
  return files.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Get navigation structure grouped by tabs and groups
 */
export interface NavigationGroup {
  id: string;
  name: string;
  items: FileNode[];
}

export interface NavigationTab {
  id: string;
  label: string;
  groups: NavigationGroup[];
}

export function getNavigationTabs(tree: FileNode[] = FILE_TREE): NavigationTab[] {
  const tabsMap = new Map<string, Map<string, FileNode[]>>();
  
  // Group files by tab and group
  function traverse(nodes: FileNode[]) {
    for (const node of nodes) {
      if (node.navigationTab && node.navigationGroup) {
        if (!tabsMap.has(node.navigationTab)) {
          tabsMap.set(node.navigationTab, new Map());
        }
        const groupsMap = tabsMap.get(node.navigationTab)!;
        if (!groupsMap.has(node.navigationGroup)) {
          groupsMap.set(node.navigationGroup, []);
        }
        groupsMap.get(node.navigationGroup)!.push(node);
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(tree);
  
  // Convert to NavigationTab structure
  const tabs: NavigationTab[] = [
    {
      id: 'docs',
      label: 'Documentation',
      groups: []
    },
    {
      id: 'api',
      label: 'API Reference',
      groups: []
    },
    {
      id: 'changelog',
      label: 'Changelog',
      groups: []
    }
  ];
  
  // Populate groups for each tab
  for (const tab of tabs) {
    const groupsMap = tabsMap.get(tab.id);
    if (groupsMap) {
      for (const [groupId, items] of groupsMap.entries()) {
        // Sort items by navigationOrder
        items.sort((a, b) => (a.navigationOrder || 0) - (b.navigationOrder || 0));
        
        tab.groups.push({
          id: groupId,
          name: groupId === 'getting-started' ? 'Getting Started' : 
                groupId === 'guides' ? 'Guides' :
                groupId === 'releases' ? 'Releases' : groupId,
          items
        });
      }
    }
  }
  
  return tabs;
}

/**
 * Helper function to get file language for Monaco editor
 */
export function getFileLanguage(fileName: string): string {
  if (fileName.endsWith('.json')) return 'json';
  if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) return 'yaml';
  if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'typescript';
  return 'markdown';
}

// ============================================================================
// DERIVED DATA (computed from FILE_TREE)
// ============================================================================

export const FILE_CONTENTS = getFileContents();
export const FILE_LIST = getFlatFileList();
export const NAVIGATION_TABS = getNavigationTabs();
