import { useState } from 'react';
import { FileText, Folder, Copy, RefreshCw, ChevronRight, ChevronDown, Loader2, GitBranch, GitPullRequest } from 'lucide-react';
import { type FileNode } from '../../data/editorData';
import { useProject } from '../../contexts/ProjectContext';

interface FilesPanelProps {
  onFileSelect?: (fileName: string, isAutoSelect?: boolean) => void;
  activeFile?: string;
  viewMode?: string;
  onViewModeChange?: (mode: 'editor' | 'code' | 'render' | 'site' | 'diff') => void;
}

export function FilesPanel({ onFileSelect, activeFile, viewMode, onViewModeChange }: FilesPanelProps) {
  const { fileTree, loading, refreshRepository, branches, currentBranch, setCurrentBranch, modifiedFiles } = useProject();
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
    const isModified = modifiedFiles.includes(node.name);

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
            <span className="flex-1 truncate">{node.displayName}</span>
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
        <span className="flex-1 truncate">{node.displayName}</span>
        {isModified && (
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" title="Unsynced changes" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">Files</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onViewModeChange?.(viewMode === 'diff' ? 'code' : 'diff')}
              title={viewMode === 'diff' ? 'Back to Editor' : 'Review Changes'}
              className={`relative p-1 rounded transition-all ${viewMode === 'diff'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100 text-gray-500'
                }`}
            >
              <GitPullRequest className="w-4 h-4" />
              {modifiedFiles.length > 0 && viewMode !== 'diff' && (
                <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[8px] px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center border-2 border-white font-bold">
                  {modifiedFiles.length}
                </span>
              )}
            </button>
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

        {/* Branch Switcher */}
        <div className="relative">
          <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs hover:border-gray-300 transition-colors">
            <GitBranch className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={currentBranch || ''}
              onChange={(e) => setCurrentBranch(e.target.value)}
              className="bg-transparent border-none p-0 flex-1 font-medium text-gray-700 focus:ring-0 cursor-pointer appearance-none"
            >
              {branches.map(branch => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : fileTree.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 italic text-xs">
            No files found
          </div>
        ) : (
          fileTree.map(node => renderFileNode(node))
        )}
      </div>
    </div>
  );
}
