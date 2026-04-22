import { registerExtension } from '@codingame/monaco-vscode-api/extensions'
import { ExtensionHostKind } from '@codingame/monaco-vscode-extensions-service-override'
import * as vscode from 'vscode'

export async function registerAiChat() {
  const { getApi } = registerExtension(
    {
      name: 'xydStudioAi',
      publisher: 'xyd',
      version: '1.0.0',
      engines: { vscode: '*' },
      contributes: {
        chatParticipants: [
          {
            id: 'xyd.studio.participant',
            fullName: 'xyd AI',
            name: 'xyd',
            isDefault: true,
            modes: ['agent'],
            locations: ['panel', 'terminal', 'editor'],
          },
        ],
        languageModelChatProviders: [
          {
            vendor: 'copilot',
            displayName: 'xyd AI provider',
          },
        ],
      },
      enabledApiProposals: [
        'defaultChatParticipant',
        'chatParticipantAdditions',
        'chatParticipantPrivate',
        'languageModelThinkingPart',
        'chatProvider',
      ],
    },
    ExtensionHostKind.LocalProcess,
    { system: true }
  )

  const vscodeApi = await getApi()

  // Register language model provider (mock - streams a demo response)
  const eventEmitter = new vscodeApi.EventEmitter<void>()

  vscodeApi.lm.registerLanguageModelChatProvider('copilot', {
    provideLanguageModelChatInformation() {
      return [
        {
          id: 'auto',
          capabilities: { toolCalling: false },
          family: 'xyd',
          maxInputTokens: 100000,
          maxOutputTokens: 100000,
          name: 'xyd AI',
          version: '1.0.0',
          isDefault: true,
          isUserSelectable: true,
        },
      ]
    },
    async provideTokenCount() {
      return 0
    },
    async provideLanguageModelChatResponse(
      _model: any,
      _messages: any,
      _options: any,
      progress: any
    ) {
      // Demo: stream a response about xyd
      const parts = [
        "I'm **xyd AI** — ",
        'your documentation assistant. ',
        'I can help you with:\n\n',
        '- Configuring `docs.json`\n',
        '- Writing Markdown/MDX content\n',
        '- Setting up OpenAPI documentation\n',
        '- Choosing and customizing themes\n',
        '- Installing and configuring plugins\n\n',
        '_This is a demo response. ',
        'Connect a real LLM backend to get actual AI assistance._',
      ]

      for (const part of parts) {
        progress.report(new vscodeApi.LanguageModelTextPart(part))
        await new Promise((r) => setTimeout(r, 100))
      }
    },
    onDidChangeLanguageModelChatInformation: eventEmitter.event,
  })

  // Register chat participant
  vscodeApi.chat.createChatParticipant(
    'xyd.studio.participant',
    async (
      request: any,
      _context: any,
      response: any
    ) => {
      const modelResponse = await request.model.sendRequest([
        vscodeApi.LanguageModelChatMessage.User(request.prompt),
      ])

      for await (const part of modelResponse.stream) {
        if (part instanceof vscode.LanguageModelTextPart) {
          response.markdown(part.value)
        }
      }
    }
  )

  console.log('[xyd studio] AI chat registered')
}
