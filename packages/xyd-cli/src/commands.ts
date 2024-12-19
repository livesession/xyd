import * as documan from "@xyd/documan"

export async function build(root: string, options: any = {}) {

}

export async function dev(root: string, options: any = {}) {
    await documan.dev()

    // keep `xyd dev` alive
    await new Promise(() => {
    });
}