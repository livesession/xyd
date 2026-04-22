import { registerExtension } from '@codingame/monaco-vscode-api/extensions'
import { ExtensionHostKind } from '@codingame/monaco-vscode-extensions-service-override'

/**
 * Registers Git-related commands in the command palette.
 * In the browser, these use Nodepod's virtual git (shell builtin)
 * via the terminal, since there's no native git binary.
 */
export async function registerGitCommands() {
  const { getApi } = registerExtension(
    {
      name: 'xydStudioGit',
      publisher: 'xyd',
      version: '1.0.0',
      engines: { vscode: '*' },
      contributes: {
        commands: [
          { command: 'xyd-git.init', title: 'Git: Initialize Repository' },
          { command: 'xyd-git.clone', title: 'Git: Clone' },
          { command: 'xyd-git.status', title: 'Git: Status' },
          { command: 'xyd-git.add', title: 'Git: Stage All Changes' },
          { command: 'xyd-git.commit', title: 'Git: Commit' },
          { command: 'xyd-git.log', title: 'Git: Log' },
          { command: 'xyd-git.diff', title: 'Git: Diff' },
          { command: 'xyd-git.branch', title: 'Git: Create Branch' },
          { command: 'xyd-git.checkout', title: 'Git: Checkout to...' },
        ],
      },
    },
    ExtensionHostKind.LocalProcess,
    { system: true }
  )

  const vscodeApi = await getApi()

  // Helper: run a command in the terminal
  async function runInTerminal(command: string) {
    const terminal =
      vscodeApi.window.activeTerminal ??
      vscodeApi.window.createTerminal('Git')
    terminal.show()
    terminal.sendText(command)
  }

  vscodeApi.commands.registerCommand('xyd-git.init', async () => {
    await runInTerminal('git init')
  })

  vscodeApi.commands.registerCommand('xyd-git.clone', async () => {
    const url = await vscodeApi.window.showInputBox({
      prompt: 'Repository URL',
      placeHolder: 'https://github.com/user/repo.git',
    })
    if (url) {
      await runInTerminal(`git clone ${url}`)
    }
  })

  vscodeApi.commands.registerCommand('xyd-git.status', async () => {
    await runInTerminal('git status')
  })

  vscodeApi.commands.registerCommand('xyd-git.add', async () => {
    await runInTerminal('git add -A')
  })

  vscodeApi.commands.registerCommand('xyd-git.commit', async () => {
    const message = await vscodeApi.window.showInputBox({
      prompt: 'Commit message',
      placeHolder: 'feat: my changes',
    })
    if (message) {
      await runInTerminal(`git commit -m "${message}"`)
    }
  })

  vscodeApi.commands.registerCommand('xyd-git.log', async () => {
    await runInTerminal('git log --oneline -20')
  })

  vscodeApi.commands.registerCommand('xyd-git.diff', async () => {
    await runInTerminal('git diff')
  })

  vscodeApi.commands.registerCommand('xyd-git.branch', async () => {
    const name = await vscodeApi.window.showInputBox({
      prompt: 'Branch name',
      placeHolder: 'feat/my-feature',
    })
    if (name) {
      await runInTerminal(`git checkout -b ${name}`)
    }
  })

  vscodeApi.commands.registerCommand('xyd-git.checkout', async () => {
    const branch = await vscodeApi.window.showInputBox({
      prompt: 'Branch to checkout',
      placeHolder: 'main',
    })
    if (branch) {
      await runInTerminal(`git checkout ${branch}`)
    }
  })

  console.log('[xyd studio] Git commands registered')
}
