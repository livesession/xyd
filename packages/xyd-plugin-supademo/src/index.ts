import { initSupademo } from './script'

export default function SupademoPlugin(
    pluginOptions: any = {} // TODO: fix any
): any {
    return function (settings: any) {
        const headScripts: ([string, Record<string, any>] | [string, Record<string, any>, string])[] = []

        // Add Supademo script if pluginOptions.apiKey is provided
        if (pluginOptions.apiKey) {
            const supademoId = pluginOptions.apiKey

            headScripts.push(
                ["script", { "src": "https://script.supademo.com/script.js", "defer": true }],
                [
                    "script",
                    {},
                    `(${initSupademo.toString()})('${supademoId}')`
                ]
            )
        } else {
            console.warn("Supademo API key is not set")
        }

        return {
            name: "plugin-supademo",
            vite: [],
            head: headScripts
        }
    }
}

