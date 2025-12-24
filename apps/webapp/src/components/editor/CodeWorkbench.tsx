import { Editor as MonacoEditor } from '@monaco-editor/react';

interface CodeWorkbenchProps {
  code: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
}

export function CodeWorkbench({ code, language = 'markdown', onChange, readOnly = false }: CodeWorkbenchProps) {
  return (
    <div className="h-full w-full border border-gray-200 rounded-lg overflow-hidden bg-white">
      <MonacoEditor
        height="100%"
        language={language}
        value={code}
        onChange={onChange}
        options={{
          fontSize: 14,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: readOnly,
          cursorStyle: 'line',
          padding: { top: 16, bottom: 16 },
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        }}
      />
    </div>
  );
}
