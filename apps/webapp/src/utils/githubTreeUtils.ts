import { type FileNode } from '../data/editorData';

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

/**
 * Transform GitHub API tree response into FileNode structure
 */
export function transformGitHubTreeToFileNodes(tree: GitHubTreeItem[]): FileNode[] {
  const rootNodes: FileNode[] = [];
  const nodeMap = new Map<string, FileNode>();

  // Sort by path to ensure parent folders are created before children
  const sortedTree = tree.sort((a, b) => a.path.localeCompare(b.path));

  for (const item of sortedTree) {
    const pathParts = item.path.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const fileType = getFileType(fileName);

    const node: FileNode = {
      id: item.path,
      name: item.path,
      displayName: fileName,
      type: item.type === 'tree' ? 'folder' : 'file',
      fileType: item.type === 'file' ? fileType : undefined,
      children: item.type === 'tree' ? [] : undefined,
    };

    nodeMap.set(item.path, node);

    // Find parent folder
    if (pathParts.length === 1) {
      // Root level
      rootNodes.push(node);
    } else {
      // Child of a folder
      const parentPath = pathParts.slice(0, -1).join('/');
      const parent = nodeMap.get(parentPath);

      if (parent && parent.children) {
        parent.children.push(node);
      } else {
        // If parent doesn't exist, add to root (shouldn't happen with sorted tree)
        rootNodes.push(node);
      }
    }
  }

  return rootNodes;
}

/**
 * Determine file type based on extension
 */
function getFileType(fileName: string): 'markdown' | 'json' | 'yaml' | 'typescript' | undefined {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'md':
    case 'mdx':
      return 'markdown';
    case 'json':
      return 'json';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return 'typescript';
    default:
      return undefined;
  }
}

/**
 * Get file language for Monaco editor
 */
export function getFileLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'json':
      return 'json';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'md':
    case 'mdx':
      return 'markdown';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    default:
      return 'plaintext';
  }
}
