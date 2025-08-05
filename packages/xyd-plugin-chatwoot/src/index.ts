import { initChatwoot } from './script'

export default function ChatwootPlugin(
    pluginOptions: any = {} // TODO: fix any
): any {
    return function () {
        const headScripts: ([string, Record<string, any>] | [string, Record<string, any>, string])[] = []

        const {
            websiteToken,
            baseURL = "https://app.chatwoot.com",
            chatwootSettings = {}
        } = pluginOptions;

        if (websiteToken) {
            headScripts.push(
                [
                    "script",
                    {},
                    `(${initChatwoot.toString()})('${websiteToken}', '${baseURL}', ${JSON.stringify(chatwootSettings)})`
                ]
            )
        } else {
            console.warn("Chatwoot website token is not set")
        }

        return {
            name: "plugin-chatwoot",
            vite: [],
            head: headScripts
        }
    }
}

