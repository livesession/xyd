import { useMemo, useState } from 'react';
import { DiffView as GitDiffView, DiffModeEnum } from '@git-diff-view/react';
import { generateDiffFile } from '@git-diff-view/file';
import { useProject } from '../../contexts/ProjectContext';
import { Loader2, AlertCircle, Maximize2, Columns } from 'lucide-react';

import '@git-diff-view/react/styles/diff-view-pure.css';

interface DiffViewProps {
    fileName: string | null;
}

export function DiffView({ fileName }: DiffViewProps) {
    const { fileContents, originalContents, loading, modifiedFiles } = useProject();
    const [viewMode, setViewMode] = useState<DiffModeEnum>(DiffModeEnum.Split);

    const diffFile = useMemo(() => {
        if (!fileName) return null;

        try {
            // If we know it's modified but the original content is still loading, 
            // return a sentinel value to show the loading screen.
            if (modifiedFiles.includes(fileName) && originalContents[fileName] === undefined) {
                return 'loading_content';
            }

            const oldContent = (originalContents[fileName] || '').replace(/\r\n/g, '\n');
            const newContent = (fileContents[fileName] || '').replace(/\r\n/g, '\n');

            // Handle identical contents to prevent library crash (Expected hunk header error)
            if (oldContent === newContent) {
                return 'no_changes';
            }

            const file = generateDiffFile(
                fileName,
                oldContent,
                fileName,
                newContent,
                fileName.split('.').pop() || 'markdown',
                fileName.split('.').pop() || 'markdown'
            );

            file.initRaw();
            file.initSyntax();

            return file;
        } catch (error) {
            console.error('[DiffView] Failed to generate diff:', error);
            return 'error_diff';
        }
    }, [fileName, fileContents, originalContents, modifiedFiles]);

    if (loading || diffFile === 'loading_content') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Loading diff...</p>
            </div>
        );
    }

    if (!fileName) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                <AlertCircle className="w-12 h-12 mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No file selected</h3>
                <p className="text-sm max-w-xs text-gray-500">Select a modified file from the list to review its changes.</p>
            </div>
        );
    }

    if (diffFile === 'no_changes') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500">
                    <Maximize2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">No changes detected</h3>
                <p className="text-sm text-gray-500 max-w-xs">The current version matches the repository HEAD. No modifications found.</p>
            </div>
        );
    }

    if (diffFile === 'error_diff') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center bg-white rounded-xl border border-red-100 shadow-sm">
                <AlertCircle className="w-12 h-12 mb-4 text-red-300" />
                <h3 className="text-lg font-medium text-red-900 mb-1">Failed to load diff</h3>
                <p className="text-sm max-w-xs text-red-500">There was an error generating the diff for this file. It might be a binary file or have an unsupported format.</p>
            </div>
        );
    }

    if (!diffFile || typeof diffFile === 'string') return null;

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Maximize2 className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight">Reviewing Changes</h3>
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{fileName}</p>
                    </div>
                </div>

                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode(DiffModeEnum.Split)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === DiffModeEnum.Split
                            ? 'bg-gray-100 text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <div className="flex items-center gap-1.5">
                            <Columns className="w-3 h-3" />
                            Split
                        </div>
                    </button>
                    <button
                        onClick={() => setViewMode(DiffModeEnum.Unified)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === DiffModeEnum.Unified
                            ? 'bg-gray-100 text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Unified
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-white">
                <div className="diff-tailwindcss-wrapper h-full" data-theme="light">
                    <GitDiffView
                        diffFile={diffFile}
                        diffViewMode={viewMode}
                        diffViewWrap={true}
                    />
                </div>
            </div>
        </div>
    );
}
