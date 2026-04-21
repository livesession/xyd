import { useEffect, useRef, useState } from 'react'
import {
  attachPart,
  renderEditorPart,
  renderSidebarPart,
  renderStatusBarPart,
  renderPanelPart,
  renderActivitybarPar,
  renderAuxiliaryPart,
  Parts,
} from '@codingame/monaco-vscode-views-service-override'
import { getService, ICommandService } from '@codingame/monaco-vscode-api/services'
import { ensureServicesInitialized, monaco } from './setup'
import { registerAiChat } from './features/ai'
import { useResizable } from './hooks/useResizable'
import { Sash } from './components/Sash'

// Theme defaults
import '@codingame/monaco-vscode-theme-defaults-default-extension'

// Language extensions
import '@codingame/monaco-vscode-javascript-default-extension'
import '@codingame/monaco-vscode-typescript-basics-default-extension'
import '@codingame/monaco-vscode-json-default-extension'
import '@codingame/monaco-vscode-css-default-extension'
import '@codingame/monaco-vscode-html-default-extension'
import '@codingame/monaco-vscode-markdown-basics-default-extension'
import '@codingame/monaco-vscode-yaml-default-extension'

// Standalone language features
import '@codingame/monaco-vscode-standalone-typescript-language-features'
import '@codingame/monaco-vscode-standalone-json-language-features'
import '@codingame/monaco-vscode-standalone-css-language-features'
import '@codingame/monaco-vscode-standalone-html-language-features'

export function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const titlebarRef = useRef<HTMLDivElement>(null)
  const activitybarRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const auxiliarybarRef = useRef<HTMLDivElement>(null)
  const statusbarRef = useRef<HTMLDivElement>(null)

  const sidebarResize = useResizable('horizontal', sidebarRef, { min: 100, max: 600 })
  const panelResize = useResizable('vertical', panelRef, { min: 50, max: 600, invert: true })
  const auxiliaryResize = useResizable('horizontal', auxiliarybarRef, { min: 100, max: 600, invert: true })

  useEffect(() => {
    let disposed = false

    ;(async () => {
      try {
        await ensureServicesInitialized()
        if (disposed) return
        await registerAiChat()
        setReady(true)
      } catch (e: any) {
        console.error('[xyd studio] init failed:', e)
        setError(e.message || String(e))
      }
    })()

    return () => { disposed = true }
  }, [])

  useEffect(() => {
    if (!ready) return

    const disposables: Array<{ dispose(): void }> = []

    const tryRender = (name: string, fn: () => { dispose(): void } | void) => {
      try {
        const d = fn()
        if (d) disposables.push(d)
      } catch (e) {
        console.warn(`[xyd studio] ${name} failed:`, e)
      }
    }

    tryRender('titlebar', () => attachPart(Parts.TITLEBAR_PART, titlebarRef.current!))
    tryRender('activitybar', () => renderActivitybarPar(activitybarRef.current!))
    tryRender('sidebar', () => renderSidebarPart(sidebarRef.current!))
    tryRender('editor', () => renderEditorPart(editorRef.current!))
    tryRender('panel', () => renderPanelPart(panelRef.current!))
    tryRender('auxiliarybar', () => renderAuxiliaryPart(auxiliarybarRef.current!))
    tryRender('statusbar', () => renderStatusBarPart(statusbarRef.current!))

    // Open explorer and default file
    ;(async () => {
      try {
        const commandService = await getService(ICommandService)
        await commandService.executeCommand('workbench.view.explorer')
        await commandService.executeCommand(
          'vscode.open',
          monaco.Uri.file('/workspace/docs.json')
        )
      } catch (e) {
        console.warn('[xyd studio] Failed to open explorer/file:', e)
      }
    })()

    return () => {
      disposables.forEach((d) => d.dispose())
    }
  }, [ready])

  if (error) {
    return <pre style={{ color: 'red', padding: 20 }}>{error}</pre>
  }

  return (
    <div id="studio">
      <div id="titlebar" ref={titlebarRef} />
      <div id="workspace">
        <div id="activitybar" ref={activitybarRef} />
        <div id="sidebar" ref={sidebarRef} />
        <Sash direction="vertical" onMouseDown={sidebarResize.onMouseDown} />
        <div id="main">
          <div id="editor" ref={editorRef} />
          <Sash direction="horizontal" onMouseDown={panelResize.onMouseDown} />
          <div id="panel" ref={panelRef} />
        </div>
        <Sash direction="vertical" onMouseDown={auxiliaryResize.onMouseDown} />
        <div id="auxiliarybar" ref={auxiliarybarRef} />
      </div>
      <div id="statusbar" ref={statusbarRef} />
    </div>
  )
}
