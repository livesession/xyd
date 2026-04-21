import { useEffect, useRef, useState } from 'react'
import { ensureServicesInitialized } from './setup'
import { registerAiChat } from './features/ai'

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
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let disposed = false

    ;(async () => {
      try {
        await ensureServicesInitialized(container)
        if (disposed) return
        await registerAiChat()
        console.log('[xyd studio] initialized')
      } catch (e: any) {
        console.error('[xyd studio] init failed:', e)
        if (!disposed) setError(e.message || String(e))
      }
    })()

    return () => { disposed = true }
  }, [])

  if (error) {
    return <pre style={{ color: 'red', padding: 20 }}>{error}</pre>
  }

  return <div id="workbench" ref={containerRef} />
}
