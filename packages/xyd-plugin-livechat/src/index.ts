import { initLivechat } from './script'

export default function LivechatPlugin(
    pluginOptions: any = {} // TODO: fix any
): any {
    return function () {
        const headScripts: ([string, Record<string, any>] | [string, Record<string, any>, string])[] = []

        const {
            licenseId,
        } = pluginOptions;

        if (licenseId) {
            headScripts.push(
                [
                    "script",
                    {},
                    `(${initLivechat.toString()})('${licenseId}')`
                ]
            )
        } else {
            console.warn("Livechat licenseId is not set")
        }

        return {
            name: "plugin-livechat",
            vite: [],
            head: headScripts
        }
    }
}

