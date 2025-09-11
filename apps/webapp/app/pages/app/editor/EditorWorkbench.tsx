import { lazy, useState, useEffect } from 'react'
import { Editor as MonacoEditor } from '@monaco-editor/react'
import { useLoaderData } from 'react-router'
import { marked } from 'marked'

// Configure marked for synchronous usage
marked.setOptions({
    async: false
})

import { Button } from '@livesession/design-system'

import { type EditorLoaderData } from './types'
import { getLanguageFromPath } from './utilts'
import './editor.css'

const EditorTreeView = lazy(() => import('./EditorTreeView').then(module => ({
    default: module.EditorTreeView
})))

export function EditorWorkbench() {
    const loaderData = useLoaderData<EditorLoaderData>()

    // Handle case where loader data is undefined (e.g., due to errors)
    if (!loaderData) {
        // TODO: ls design system
        return (
            <div style={{ padding: "16px" }}>
                <h2>Error Loading Editor</h2>
                <p>Unable to load repository data. Please check your GitHub configuration and try again.</p>
            </div>
        )
    }

    const { treeItems, fileContents, initialFile } = loaderData

    // File content cache - maps file path to content (starts with pre-loaded contents)
    const [fileCache, setFileCache] = useState<Map<string, string>>(fileContents)
    const [currentFile, setCurrentFile] = useState<string | null>(initialFile || null)
    const [code, setCode] = useState(() => {
        if (initialFile && fileContents.has(initialFile)) {
            return fileContents.get(initialFile) || ''
        }
        return ''
    })
    
    // Editor mode state - 'monaco' or 'markdown'
    const [editorMode, setEditorMode] = useState<'monaco' | 'markdown'>('monaco')
    
    // Check if current file is markdown
    const isMarkdownFile = currentFile && (currentFile.endsWith('.md') || currentFile.endsWith('.mdx'))
    
    // Track if there are unsaved changes
    const hasUnsavedChanges = currentFile && fileCache.has(currentFile) && 
        fileContents.has(currentFile) && 
        fileCache.get(currentFile) !== fileContents.get(currentFile)

    // Markdown preview state
    const [markdownPreview, setMarkdownPreview] = useState('')
    
    // Update markdown preview when code changes
    useEffect(() => {
        if (editorMode === 'markdown' && isMarkdownFile) {
            const html = marked(code) as string
            setMarkdownPreview(html)
        }
    }, [code, editorMode, isMarkdownFile])

    const handleEditorChange = (value: string | undefined) => {
        setCode(value || '')
        // Update cache with current changes
        if (currentFile) {
            setFileCache(prev => new Map(prev).set(currentFile, value || ''))
        }
    }

    const handleFileSelect = (filePath: string) => {
        // File content is already loaded, just switch to it
        if (fileCache.has(filePath)) {
            setCurrentFile(filePath)
            const content = fileCache.get(filePath) || ''
            setCode(content)
         
            // Reset editor mode to monaco for non-markdown files
            if (!filePath.endsWith('.md') && !filePath.endsWith('.mdx')) {
                setEditorMode('monaco')
            }
        } else {
            console.error('File not found in cache:', filePath)
        }
    }

    const toggleEditorMode = () => {
        if (isMarkdownFile) {
            const newMode = editorMode === 'monaco' ? 'markdown' : 'monaco'
            setEditorMode(newMode)
            
            // Update preview when switching to markdown mode
            if (newMode === 'markdown') {
                const html = marked(code) as string
                setMarkdownPreview(html)
            }
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: "8px 16px" }}>
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                <div style={{ width: '200px' }}>
                    <EditorTreeView
                        treeItems={treeItems}
                        onFileSelect={handleFileSelect}
                        selectedFile={currentFile || undefined}
                    />
                </div>

                <div style={{ flex: '1', width: "1200px", display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ marginLeft: "30px", marginBottom: "10px", display: 'flex', gap: '8px' }}>
                        <Button disabled={!hasUnsavedChanges}>
                            Save (⌘ + s)
                        </Button>
                        {isMarkdownFile && (
                            <Button 
                                onClick={toggleEditorMode}
                            >
                                {editorMode === 'monaco' ? 'Markdown' : 'Code'}
                            </Button>
                        )}
                    </div>

                    <div style={{ flex: 1, minHeight: 0 }}>
                        {editorMode === 'markdown' && isMarkdownFile ? (
                            <div style={{ 
                                height: '100%', 
                                display: 'flex',
                                gap: '8px'
                            }}>
                                {/* Markdown Editor */}
                                <div style={{ 
                                    flex: 1,
                                    border: '1px solid #e1e4e8', 
                                    borderRadius: '6px',
                                    overflow: 'hidden'
                                }}>
                                    <MonacoEditor
                                        height="100%"
                                        language="markdown"
                                        value={code}
                                        onChange={handleEditorChange}
                                        options={{
                                            fontSize: 14,
                                            minimap: { enabled: false },
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            tabSize: 2,
                                            insertSpaces: true,
                                            wordWrap: 'on',
                                            lineNumbers: 'on',
                                            renderLineHighlight: 'all',
                                            selectOnLineNumbers: true,
                                            roundedSelection: false,
                                            readOnly: false,
                                            cursorStyle: 'line',
                                        }}
                                    />
                                </div>
                                
                                {/* Markdown Preview */}
                                <div style={{ 
                                    flex: 1,
                                    border: '1px solid #e1e4e8', 
                                    borderRadius: '6px',
                                    padding: '16px',
                                    overflow: 'auto',
                                    backgroundColor: '#ffffff'
                                }}>
                                    <div 
                                        className="markdown-preview"
                                        dangerouslySetInnerHTML={{ __html: markdownPreview }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <MonacoEditor
                                height="100%"
                                language={currentFile ? getLanguageFromPath(currentFile) : 'typescript'}
                                value={code}
                                onChange={handleEditorChange}
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
                                    readOnly: false,
                                    cursorStyle: 'line',
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}


