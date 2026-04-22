import { Nodepod } from '@scelar/nodepod'

export type NodepodInstance = Awaited<ReturnType<typeof Nodepod.boot>>

// Initial files for the xyd workspace
const initialFiles: Record<string, string> = {
  '/workspace/docs.json': JSON.stringify(
    {
      $schema: 'https://xyd.dev/schema.json',
      theme: { name: 'poetry' },
      navigation: {
        sidebar: [
          {
            route: '/docs',
            pages: [{ title: 'Introduction', href: '/docs/introduction' }],
          },
        ],
      },
    },
    null,
    2
  ),
  '/workspace/package.json': JSON.stringify(
    {
      name: 'my-docs',
      private: true,
      scripts: { dev: 'xyd', build: 'xyd build' },
      dependencies: { 'xyd-js': 'latest' },
    },
    null,
    2
  ),
  '/workspace/content/introduction.md': [
    '---',
    'title: Introduction',
    'description: Welcome to xyd documentation',
    '---',
    '',
    '# Welcome to xyd',
    '',
    'This is your first documentation page. Edit this file to get started.',
    '',
    '## Features',
    '',
    '- **Markdown/MDX** support',
    '- **OpenAPI** documentation',
    '- **GraphQL** documentation',
    '- **Themes** and customization',
    '- **Plugin** system',
    '',
    '```typescript',
    "import { Settings } from '@xyd-js/core';",
    '',
    'const settings: Settings = {',
    "  theme: { name: 'poetry' },",
    '};',
    '',
    'export default settings;',
    '```',
  ].join('\n'),
}

// Server ready listeners
type ServerReadyListener = (port: number, url: string) => void
const serverReadyListeners: ServerReadyListener[] = []

export function onServerReady(listener: ServerReadyListener) {
  serverReadyListeners.push(listener)
  return () => {
    const idx = serverReadyListeners.indexOf(listener)
    if (idx >= 0) serverReadyListeners.splice(idx, 1)
  }
}

// Singleton
let instance: NodepodInstance | null = null
let booting: Promise<NodepodInstance> | null = null

export async function getNodepod(): Promise<NodepodInstance> {
  if (instance) return instance
  if (booting) return booting

  booting = Nodepod.boot({
    files: initialFiles,
    workdir: '/workspace',
    serviceWorker: true,
    watermark: false,
    onServerReady(port: number, url: string) {
      console.log(`[xyd studio] Server ready on port ${port}: ${url}`)
      for (const listener of serverReadyListeners) {
        listener(port, url)
      }
    },
  })

  instance = await booting
  return instance
}
