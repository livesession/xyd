import { initialize as initializeMonacoService } from '@codingame/monaco-vscode-api/services'
import getConfigurationServiceOverride, {
  initUserConfiguration,
} from '@codingame/monaco-vscode-configuration-service-override'
import getKeybindingsServiceOverride, {
  initUserKeybindings,
} from '@codingame/monaco-vscode-keybindings-service-override'
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override'
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override'
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override'
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override'
import getFilesServiceOverride, {
  RegisteredMemoryFile,
  RegisteredFileSystemProvider,
  registerFileSystemOverlay,
} from '@codingame/monaco-vscode-files-service-override'
import getSearchServiceOverride from '@codingame/monaco-vscode-search-service-override'
import getWorkbenchServiceOverride from '@codingame/monaco-vscode-workbench-service-override'
import getExtensionsServiceOverride from '@codingame/monaco-vscode-extensions-service-override'
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override'
import getExtensionGalleryServiceOverride from '@codingame/monaco-vscode-extension-gallery-service-override'
import getLanguageDetectionWorkerServiceOverride from '@codingame/monaco-vscode-language-detection-worker-service-override'
import getStorageServiceOverride from '@codingame/monaco-vscode-storage-service-override'
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override'
import getSnippetsServiceOverride from '@codingame/monaco-vscode-snippets-service-override'
import getQuickaccessServiceOverride from '@codingame/monaco-vscode-quickaccess-service-override'
import getNotificationsServiceOverride from '@codingame/monaco-vscode-notifications-service-override'
import getDialogsServiceOverride from '@codingame/monaco-vscode-dialogs-service-override'
import getOutputServiceOverride from '@codingame/monaco-vscode-output-service-override'
import getMarkersServiceOverride from '@codingame/monaco-vscode-markers-service-override'
import getLogServiceOverride from '@codingame/monaco-vscode-log-service-override'
import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override'
import getTerminalServiceOverride from '@codingame/monaco-vscode-terminal-service-override'
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override'
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override'
import getBannerServiceOverride from '@codingame/monaco-vscode-view-banner-service-override'
import getChatServiceOverride from '@codingame/monaco-vscode-chat-service-override'
import getAiServiceOverride from '@codingame/monaco-vscode-ai-service-override'
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override'
import * as monaco from 'monaco-editor'
import * as vscode from 'vscode'

// --- Workers ---
if (typeof window !== 'undefined') {
  ;(window as any).MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
      switch (label) {
        case 'TextMateWorker':
          return new Worker(
            new URL(
              '@codingame/monaco-vscode-textmate-service-override/worker',
              import.meta.url
            ),
            { type: 'module' }
          )
        default:
          return new Worker(
            new URL(
              'monaco-editor/esm/vs/editor/editor.worker.js',
              import.meta.url
            ),
            { type: 'module' }
          )
      }
    },
  }
}

// --- Filesystem ---
const fileSystemProvider = new RegisteredFileSystemProvider(false)

fileSystemProvider.registerFile(
  new RegisteredMemoryFile(
    vscode.Uri.file('/workspace/docs.json'),
    JSON.stringify(
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
    )
  )
)

fileSystemProvider.registerFile(
  new RegisteredMemoryFile(
    vscode.Uri.file('/workspace/content/introduction.md'),
    `---
title: Introduction
description: Welcome to xyd documentation
---

# Welcome to xyd

This is your first documentation page. Edit this file to get started.

## Features

- **Markdown/MDX** support
- **OpenAPI** documentation
- **GraphQL** documentation
- **Themes** and customization
- **Plugin** system

\`\`\`typescript
import { Settings } from '@xyd-js/core';

const settings: Settings = {
  theme: { name: 'poetry' },
};

export default settings;
\`\`\`
`
  )
)

fileSystemProvider.registerFile(
  new RegisteredMemoryFile(
    vscode.Uri.file('/workspace/package.json'),
    JSON.stringify(
      {
        name: 'my-docs',
        private: true,
        scripts: { dev: 'xyd', build: 'xyd build' },
        dependencies: { 'xyd-js': 'latest' },
      },
      null,
      2
    )
  )
)

// --- Pre-initialization ---
const defaultConfiguration = JSON.stringify({
  'workbench.colorTheme': 'Default Dark Modern',
  'workbench.activityBar.location': 'default',
  'editor.fontSize': 14,
  'editor.minimap.enabled': false,
  'editor.guides.bracketPairs': true,
})

const defaultKeybindings = JSON.stringify([])

export async function preInitialize() {
  await Promise.all([
    initUserConfiguration(defaultConfiguration),
    initUserKeybindings(defaultKeybindings),
  ])
}

// --- Initialize ---
let servicesReady = false
let servicesPromise: Promise<void> | null = null

export async function ensureServicesInitialized(container: HTMLElement): Promise<void> {
  if (servicesReady) return
  if (servicesPromise) return servicesPromise

  servicesPromise = (async () => {
    // Register filesystem BEFORE init
    registerFileSystemOverlay(1, fileSystemProvider)

    await preInitialize()

    try {
      await initializeMonacoService(
        {
          ...getLogServiceOverride(),
          ...getEnvironmentServiceOverride(),
          ...getConfigurationServiceOverride(),
          ...getStorageServiceOverride(),
          ...getModelServiceOverride(),
          ...getNotificationsServiceOverride(),
          ...getDialogsServiceOverride(),
          ...getLanguagesServiceOverride(),
          ...getLanguageDetectionWorkerServiceOverride(),
          ...getTextmateServiceOverride(),
          ...getThemeServiceOverride(),
          ...getKeybindingsServiceOverride(),
          ...getLifecycleServiceOverride(),
          ...getSnippetsServiceOverride(),
          ...getQuickaccessServiceOverride({
            isKeybindingConfigurationVisible: () => true,
            shouldUseGlobalPicker: () => true,
          }),
          ...getWorkbenchServiceOverride(),
          ...getFilesServiceOverride(),
          ...getSearchServiceOverride(),
          ...getExtensionsServiceOverride(),
          ...getExtensionGalleryServiceOverride({ webOnly: false }),
          ...getExplorerServiceOverride(),
          ...getTerminalServiceOverride(),
          ...getStatusBarServiceOverride(),
          ...getTitleBarServiceOverride(),
          ...getBannerServiceOverride(),
          ...getChatServiceOverride({
            defaultAccount: {
              entitlementsData: {
                access_type_sku: 'unused',
                copilot_plan: 'enterprise',
                can_signup_for_limited: false,
                assigned_date: 'unused',
                organization_login_list: [],
                analytics_tracking_id: 'unused',
              } as any,
              accountName: 'xyd-studio',
              authenticationProvider: {
                id: 'unused',
                name: 'unused',
                enterprise: true,
              },
              enterprise: true,
              sessionId: 'unused',
            },
          }),
          ...getAiServiceOverride(),
          ...getOutputServiceOverride(),
          ...getMarkersServiceOverride(),
          ...getLocalizationServiceOverride({
            async setLocale() {},
            async clearLocale() {},
            availableLanguages: [],
          }),
        },
        container,
        {
          workspaceProvider: {
            trusted: true,
            workspace: { folderUri: monaco.Uri.file('/workspace') },
            async open() {
              return false
            },
          },
          productConfiguration: {
            nameLong: 'xyd studio',
            nameShort: 'xyd studio',
            extensionsGallery: {
              serviceUrl: 'https://open-vsx.org/vscode/gallery',
              itemUrl: 'https://open-vsx.org/vscode/item',
              resourceUrlTemplate:
                'https://open-vsx.org/vscode/unpkg/{publisher}/{name}/{version}/{path}',
              controlUrl: '',
              nlsBaseUrl: '',
              publisherUrl: '',
            } as any,
          },
          defaultLayout: {
            editors: [
              {
                uri: monaco.Uri.file('/workspace/docs.json'),
                viewColumn: 1,
              },
            ],
          },
        }
      )
    } catch (e: any) {
      if (!e?.message?.includes('already initialized')) throw e
    }

    servicesReady = true
  })()

  return servicesPromise
}

export { monaco, vscode }
