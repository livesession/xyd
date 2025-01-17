import * as documan from "@xyd-js/documan"

export async function build(root: string, options: any = {}) {
    await documan.build()
}

export async function start(root: string, options: any = {}) {
    await documan.serve()

    // keep `xyd dev` alive
    await new Promise(() => {
    });
}

export async function dev(root: string, options: any = {}) {
    await documan.dev()

    // keep `xyd dev` alive
    await new Promise(() => {
    });
}