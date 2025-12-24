import { NavigationPanel } from './NavigationPanel';
import { FilesPanel } from './FilesPanel';

interface EditorSidebarProps {
  mode: 'navigation' | 'files';
  onFileSelect?: (fileName: string, isAutoSelect?: boolean) => void;
  activeFile?: string;
  viewMode?: string;
  onViewModeChange?: (mode: 'editor' | 'code' | 'render' | 'site' | 'diff') => void;
}

export function EditorSidebar({ mode, onFileSelect, activeFile, viewMode, onViewModeChange }: EditorSidebarProps) {
  return (
    <div className="w-[300px] flex-shrink-0 border-r border-gray-200 bg-white h-full flex flex-col">
      {mode === 'navigation' ? (
        <NavigationPanel onFileSelect={onFileSelect} activeFile={activeFile} />
      ) : (
        <FilesPanel
          onFileSelect={onFileSelect}
          activeFile={activeFile}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      )}
    </div>
  );
}
