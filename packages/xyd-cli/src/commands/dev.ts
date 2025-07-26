import * as documan from "@xyd-js/documan"

export async function dev(options: any = {}) {
    await documan.dev(options)

    // keep `xyd dev` alive
    await new Promise(() => {
    });
}

