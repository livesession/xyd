import { initIntercom } from './script'

export default function IntercomPlugin(
    pluginOptions: any = {} // TODO: fix any
): any {
    return function () {
        const headScripts: ([string, Record<string, any>] | [string, Record<string, any>, string])[] = []

        const {
            appId,
            apiBase = "https://api-iam.intercom.io",
        } = pluginOptions;
        
        if (appId) {
            headScripts.push(
                [
                    "script",
                    {},
                    `(${initIntercom.toString()})('${appId}', '${apiBase}')`
                ]
            )
        } else {
            console.warn("Intercom appId is not set")
        }

        return {
            name: "plugin-intercom",
            vite: [],
            head: headScripts
        }
    }
}

