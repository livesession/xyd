import { useState } from 'react';
import { FileText, Folder, Copy, RefreshCw, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { type FileNode } from '../../data/editorData';
import { useProject } from '../../contexts/ProjectContext';

interface FilesPanelProps {
  onFileSelect?: (fileName: string) => void;
  activeFile?: string;
}

export function FilesPanel({ onFileSelect, activeFile }: FilesPanelProps) {
  const { fileTree, loading, refreshRepository } = useProject();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isActive = node.name === activeFile;
    const paddingLeft = depth * 12 + 8;

    if (node.type === 'folder') {
      return (
        <div key={node.id}>
          <div
            onClick={() => toggleFolder(node.id)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors hover:bg-gray-50 text-gray-700"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            <Folder className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <span>{node.displayName}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderFileNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.id}
        onClick={() => onFileSelect?.(node.name)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${isActive ? 'bg-gray-100 font-medium text-gray-900' : 'hover:bg-gray-50 text-gray-700'
          }`}
        style={{ paddingLeft: `${paddingLeft + 20}px` }}
      >
        {node.fileType === 'json' && <span className="text-yellow-600 font-mono text-[10px] w-4 text-center flex-shrink-0">{'{}'}</span>}
        {node.fileType === 'yaml' && <FileText className="w-4 h-4 text-orange-600 flex-shrink-0" />}
        {node.fileType === 'markdown' && <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />}
        {node.fileType === 'typescript' && <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />}
        <span>{node.displayName}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">Files</span>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-gray-100 rounded text-gray-500"><Copy className="w-4 h-4" /></button>
          <button
            onClick={refreshRepository}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : fileTree.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No files found
          </div>
        ) : (
          <div className="space-y-0.5">
            {fileTree.map(node => renderFileNode(node))}
          </div>
        )}
      </div>
    </div>
  );
}
