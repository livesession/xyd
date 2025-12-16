import { useState } from 'react';
import { EditorSidebar } from '../components/editor/EditorSidebar';
import { Globe, PenTool, Code2, Sparkles, FileText } from 'lucide-react';
import { CodeWorkbench } from '../components/editor/CodeWorkbench';
import { VisualEditor } from '../components/editor/VisualEditor';

const MOCK_FILES: Record<string, string> = {
  'introduction': `# Introduction

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

:::callout
Example callout
:::
`,
  'quickstart': `# Quickstart

Get started in minutes.

\`\`\`bash
npm install @documentation-ai/core
\`\`\`
`,
  'changelog': `# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-01-01

- Initial release
`,
  'configuration': `# Configuration

Configure your documentation site.

\`\`\`json
{
  "title": "My Docs",
  "theme": "light"
}
\`\`\`
`,
  'documentation.json': `{
  "name": "My Documentation",
  "version": "1.0.0",
  "private": true
}
`,
  'openapi.yaml': `openapi: 3.0.0
info:
  title: Sample API
  version: 0.1.9
`,
  'organizing-documentation': `# Organizing Documentation

Learn how to structure your docs.
`
};

export function Editor() {
  const [mode, setMode] = useState<'navigation' | 'files'>('navigation');
  const [viewMode, setViewMode] = useState<'editor' | 'code'>('code');
  const [currentFile, setCurrentFile] = useState<string>('introduction');
  const [files, setFiles] = useState<Record<string, string>>(MOCK_FILES);

  const handleFileSelect = (fileName: string) => {
    setCurrentFile(fileName);
  };

  const handleContentChange = (val: string | undefined) => {
    if (val !== undefined) {
      setFiles(prev => ({ ...prev, [currentFile]: val }));
    }
  };

  const getLanguage = (fileName: string) => {
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) return 'yaml';
    if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'typescript';
    return 'markdown';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Top Bar - Local to Editor */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white flex-shrink-0 z-10">
        <div className="flex items-center p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setMode('navigation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'navigation' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span className="w-4 h-4 flex items-center justify-center border border-current rounded-[4px]">
              <span className="w-1.5 h-2.5 border-l border-current"></span>
            </span>
            Navigation
          </button>
          <button
            onClick={() => setMode('files')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'files' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span className="w-4 h-4 flex items-center justify-center border border-current rounded-[4px]">tG</span>
            Files/URL Paths
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
            <span>/{currentFile}</span>
            <button><FileText className="w-3 h-3" /></button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'editor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <PenTool className="w-3 h-3" /> Editor
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Code2 className="w-3 h-3" /> Code
            </button>
          </div>
          <button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Globe className="w-3 h-3" /> Publish
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar mode={mode} onFileSelect={handleFileSelect} activeFile={currentFile} />

        <div className="flex-1 bg-[#FAFAFA] relative p-4">
          {viewMode === 'code' ? (
            <CodeWorkbench
              code={files[currentFile] || ''}
              onChange={handleContentChange}
              language={getLanguage(currentFile)}
            />
          ) : (
            <VisualEditor
              content={files[currentFile] || ''}
              onChange={handleContentChange}
            />
          )}

          {/* AI Agent Button */}
          <div className="absolute bottom-6 right-6 z-10">
            <button className="bg-[#1f1f1f] hover:bg-black text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium transition-colors">
              <Sparkles className="w-4 h-4" />
              AI Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
