import { NavigationPanel } from './NavigationPanel';
import { FilesPanel } from './FilesPanel';

interface EditorSidebarProps {
  mode: 'navigation' | 'files';
  onFileSelect?: (fileName: string) => void;
  activeFile?: string;
}

export function EditorSidebar({ mode, onFileSelect, activeFile }: EditorSidebarProps) {
  return (
    <div className="w-[300px] flex-shrink-0 border-r border-gray-200 bg-white h-full flex flex-col">
      {mode === 'navigation' ? (
        <NavigationPanel onFileSelect={onFileSelect} activeFile={activeFile} />
      ) : (
        <FilesPanel onFileSelect={onFileSelect} activeFile={activeFile} />
      )}
    </div>
  );
}
