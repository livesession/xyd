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
