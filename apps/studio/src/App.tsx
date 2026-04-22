import { useEffect, useRef, useState } from 'react'
import { ensureServicesInitialized } from './setup'
import { registerAiChat } from './features/ai'
import { registerPreview } from './features/preview'
import { registerGitCommands } from './features/git'

// Bundled + VSIX extensions (static imports)
import './extensions'

import {
  waitForVsixExtensions,
  installMarketplaceExtensions,
  applyDefaultExtensionSettings,
} from './extensions'

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

        // Wait for VSIX extensions (Symbols icons)
        await waitForVsixExtensions()

        await registerAiChat()
        await registerPreview()
        await registerGitCommands()

        // Install marketplace extensions (GitHub Theme) + apply settings
        const vscodeApi = await import('vscode')
        await installMarketplaceExtensions(vscodeApi)
        await applyDefaultExtensionSettings(vscodeApi)

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
