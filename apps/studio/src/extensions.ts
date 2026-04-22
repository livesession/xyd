/**
 * Default extensions for xyd studio.
 *
 * 1. Bundled extensions (npm @codingame packages) — static imports
 * 2. VSIX extensions — loaded via rollup-vsix-plugin at build time
 * 3. Marketplace extensions — installed from OpenVSX at runtime
 */

// --- Bundled extensions (static imports) ---

// Theme defaults (Dark Modern, Light Modern, Dark+, Light+, etc.)
import '@codingame/monaco-vscode-theme-defaults-default-extension'

// Seti file icons (fallback)
import '@codingame/monaco-vscode-theme-seti-default-extension'

// Language grammars
import '@codingame/monaco-vscode-javascript-default-extension'
import '@codingame/monaco-vscode-typescript-basics-default-extension'
import '@codingame/monaco-vscode-json-default-extension'
import '@codingame/monaco-vscode-css-default-extension'
import '@codingame/monaco-vscode-html-default-extension'
import '@codingame/monaco-vscode-markdown-basics-default-extension'
import '@codingame/monaco-vscode-yaml-default-extension'

// Language features (intellisense)
import '@codingame/monaco-vscode-standalone-typescript-language-features'
import '@codingame/monaco-vscode-standalone-json-language-features'
import '@codingame/monaco-vscode-standalone-css-language-features'
import '@codingame/monaco-vscode-standalone-html-language-features'

// Git support (provides Git: Clone, Git: Init, etc. commands)
import '@codingame/monaco-vscode-git-base-default-extension'

// --- VSIX extensions (loaded at build time via rollup-vsix-plugin) ---

import { whenReady as symbolsReady } from '../symbols-web-0.0.25.vsix'

export async function waitForVsixExtensions() {
  await symbolsReady
  console.log('[xyd studio] VSIX extension loaded: Symbols icon theme')
}

// --- Marketplace extensions ---

interface MarketplaceExtension {
  id: string
  displayName: string
}

const marketplaceExtensions: MarketplaceExtension[] = [
  { id: 'GitHub.github-vscode-theme', displayName: 'GitHub Theme' },
]

export async function installMarketplaceExtensions(
  vscodeApi: typeof import('vscode')
) {
  for (const ext of marketplaceExtensions) {
    try {
      await vscodeApi.commands.executeCommand(
        'workbench.extensions.installExtension',
        ext.id
      )
      console.log(`[xyd studio] Installed extension: ${ext.displayName}`)
    } catch (e) {
      console.warn(`[xyd studio] Failed to install ${ext.displayName}:`, e)
    }
  }
}

// --- Apply defaults ---

export async function applyDefaultExtensionSettings(
  vscodeApi: typeof import('vscode')
) {
  try {
    const config = vscodeApi.workspace.getConfiguration()
    await config.update(
      'workbench.colorTheme',
      'GitHub Light Default',
      vscodeApi.ConfigurationTarget.Global
    )
    await config.update(
      'workbench.iconTheme',
      'symbols',
      vscodeApi.ConfigurationTarget.Global
    )
    console.log('[xyd studio] Applied: GitHub Light Default + Symbols icons')
  } catch (e) {
    console.warn('[xyd studio] Failed to apply default settings:', e)
  }
}
