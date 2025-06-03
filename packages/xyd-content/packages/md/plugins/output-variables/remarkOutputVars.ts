import { outputVars } from './lib'
import { outputVarsFromMarkdown, outputVarsToMarkdown } from './lib/util'

export function remarkOutputVars() {
    console.time('plugin:remarkOutputVars');
    const data = this.data()

    const micromarkExtensions =
        data.micromarkExtensions || (data.micromarkExtensions = [])
    const fromMarkdownExtensions =
        data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
    const toMarkdownExtensions =
        data.toMarkdownExtensions || (data.toMarkdownExtensions = [])

    micromarkExtensions.push(outputVars())
    fromMarkdownExtensions.push(outputVarsFromMarkdown())
    toMarkdownExtensions.push(outputVarsToMarkdown())

    console.timeEnd('plugin:remarkOutputVars');
    return function () { }
}

