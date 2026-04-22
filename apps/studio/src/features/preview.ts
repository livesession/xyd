import { registerExtension } from '@codingame/monaco-vscode-api/extensions'
import { ExtensionHostKind } from '@codingame/monaco-vscode-extensions-service-override'
import { onServerReady, getNodepod } from './nodepod'

export async function registerPreview() {
  const { getApi } = registerExtension(
    {
      name: 'xydStudioPreview',
      publisher: 'xyd',
      version: '1.0.0',
      engines: { vscode: '*' },
      contributes: {
        commands: [
          {
            command: 'xyd-studio.openPreview',
            title: 'xyd Studio: Open Preview',
          },
        ],
      },
    },
    ExtensionHostKind.LocalProcess,
    { system: true }
  )

  const vscodeApi = await getApi()
  let currentPanel: any = null

  function openPreview(port: number) {
    const pod = (globalThis as any).__nodepodInstance
    // Get the preview URL from Nodepod's service worker proxy
    const previewUrl = pod?.port(port)

    if (currentPanel) {
      currentPanel.reveal(vscodeApi.ViewColumn.Beside)
      updatePanel(currentPanel, port, previewUrl)
      return
    }

    currentPanel = vscodeApi.window.createWebviewPanel(
      'xydPreview',
      `Preview :${port}`,
      vscodeApi.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    )

    updatePanel(currentPanel, port, previewUrl)

    currentPanel.onDidDispose(() => {
      currentPanel = null
    })
  }

  function updatePanel(panel: any, port: number, previewUrl: string | null) {
    const url = previewUrl || `http://localhost:${port}`
    panel.title = `Preview :${port}`
    panel.webview.html = `<!DOCTYPE html>
<html style="height:100%;width:100%;margin:0;padding:0;">
<head>
  <style>
    body { margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; background: #1e1e1e; }
    .toolbar {
      height: 32px;
      background: #252526;
      border-bottom: 1px solid #333;
      display: flex;
      align-items: center;
      padding: 0 8px;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      color: #ccc;
    }
    .url-bar {
      flex: 1;
      background: #3c3c3c;
      border: 1px solid #555;
      border-radius: 4px;
      color: #ccc;
      padding: 2px 8px;
      font-size: 12px;
      font-family: monospace;
      outline: none;
    }
    .url-bar:focus { border-color: #007acc; }
    .btn {
      background: none;
      border: 1px solid #555;
      border-radius: 4px;
      color: #ccc;
      padding: 2px 8px;
      cursor: pointer;
      font-size: 12px;
    }
    .btn:hover { background: #3c3c3c; }
    iframe {
      width: 100%;
      height: calc(100vh - 33px);
      border: none;
      background: white;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn" onclick="document.getElementById('preview').src = document.getElementById('urlbar').value" title="Refresh">↻</button>
    <input id="urlbar" class="url-bar" value="${url}" onkeydown="if(event.key==='Enter')document.getElementById('preview').src=this.value" />
    <button class="btn" onclick="window.open(document.getElementById('urlbar').value, '_blank')" title="Open in new tab">↗</button>
  </div>
  <iframe id="preview" src="${url}" allow="cross-origin-isolated"></iframe>
</body>
</html>`
  }

  // Register command
  vscodeApi.commands.registerCommand('xyd-studio.openPreview', () => {
    // Open preview for port 5173 by default (Vite's default)
    openPreview(5173)
  })

  // Auto-open preview when a server starts
  onServerReady(async (port, _url) => {
    // Store the nodepod instance globally for the preview to access port()
    const pod = await getNodepod()
    ;(globalThis as any).__nodepodInstance = pod
    openPreview(port)
  })

  // Store instance for manual preview opens too
  getNodepod().then((pod) => {
    ;(globalThis as any).__nodepodInstance = pod
  })

  console.log('[xyd studio] Preview registered')
}
