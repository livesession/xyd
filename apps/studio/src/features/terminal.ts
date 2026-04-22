import {
  SimpleTerminalBackend,
  SimpleTerminalProcess,
  type ITerminalChildProcess,
} from '@codingame/monaco-vscode-terminal-service-override'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import * as vscode from 'vscode'
import { getNodepod, type NodepodInstance } from './nodepod'

class NodepodTerminalBackend extends SimpleTerminalBackend {
  async getDefaultSystemShell() {
    return '/bin/sh'
  }

  async createProcess(): Promise<ITerminalChildProcess> {
    const pod = await getNodepod()
    return new NodepodTerminalProcess(pod)
  }
}

class NodepodTerminalProcess extends SimpleTerminalProcess {
  private onDataEmitter = new vscode.EventEmitter<string>()
  private pod: NodepodInstance
  private nodepodTerminal: ReturnType<NodepodInstance['createTerminal']> | null =
    null
  private hiddenContainer: HTMLDivElement | null = null

  constructor(pod: NodepodInstance) {
    const emitter = new vscode.EventEmitter<string>()
    super(0, 1, '/workspace', emitter.event)
    this.pod = pod
    ;(this as any).onData = this.onDataEmitter.event
    ;(this as any).onProcessData = this.onDataEmitter.event
  }

  async start() {
    this.hiddenContainer = document.createElement('div')
    this.hiddenContainer.style.position = 'absolute'
    this.hiddenContainer.style.left = '-9999px'
    this.hiddenContainer.style.width = '800px'
    this.hiddenContainer.style.height = '400px'
    document.body.appendChild(this.hiddenContainer)

    this.nodepodTerminal = this.pod.createTerminal({
      Terminal,
      FitAddon,
    })

    this.nodepodTerminal.attach(this.hiddenContainer)

    const xt = this.nodepodTerminal.xterm
    if (xt) {
      const origWrite = xt.write.bind(xt)
      xt.write = ((data: string | Uint8Array, callback?: () => void) => {
        const text = typeof data === 'string' ? data : new TextDecoder().decode(data)
        this.onDataEmitter.fire(text)
        origWrite(data, callback)
      }) as typeof xt.write
    }

    ;(this as any).onReady.fire({
      pid: 1,
      cwd: '/workspace',
      windowsPty: undefined,
    })

    return undefined
  }

  input(data: string) {
    if (this.nodepodTerminal) {
      ;(this.nodepodTerminal as any).input?.(data)
      if (typeof (this.nodepodTerminal as any).input !== 'function') {
        this.nodepodTerminal.xterm?.paste(data)
      }
    }
  }

  sendSignal() {}
  clearBuffer() {
    this.nodepodTerminal?.clear?.()
  }

  shutdown() {
    this.nodepodTerminal?.detach()
    this.nodepodTerminal = null
    this.hiddenContainer?.remove()
    this.hiddenContainer = null
  }

  resize(cols: number, rows: number) {
    if (this.nodepodTerminal?.xterm) {
      this.nodepodTerminal.xterm.resize(cols, rows)
      this.nodepodTerminal.fit?.()
    }
  }
}

export const terminalBackend = new NodepodTerminalBackend()
