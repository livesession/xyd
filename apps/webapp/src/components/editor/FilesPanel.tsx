import { FileText, Folder, Copy, RefreshCw } from 'lucide-react';

const files = [
  { name: 'changelog', type: 'folder' },
  { name: 'configuration', type: 'folder' },
  { name: 'documentation.json', type: 'json' },
  { name: 'introduction', type: 'folder' },
  { name: 'openapi.yaml', type: 'yaml' },
  { name: 'organizing-documentation', type: 'folder' },
  { name: 'quickstart', type: 'folder' },
];

interface FilesPanelProps {
  onFileSelect?: (fileName: string) => void;
}

export function FilesPanel({ onFileSelect }: FilesPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">Files</span>
          <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-gray-100 rounded text-gray-500"><Copy className="w-4 h-4" /></button>
              <button className="p-1 hover:bg-gray-100 rounded text-gray-500"><RefreshCw className="w-4 h-4" /></button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-0.5">
              {files.map((file, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => onFileSelect?.(file.name)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${file.name === 'introduction' ? 'bg-gray-100 font-medium text-gray-900' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                      {file.type === 'folder' && <Folder className="w-4 h-4 text-orange-400" />}
                      {file.type === 'json' && <span className="text-yellow-600 font-mono text-[10px] w-4 text-center">{'{}'}</span>}
                      {file.type === 'yaml' && <FileText className="w-4 h-4 text-orange-600" />}
                      <span>{file.name}</span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}
