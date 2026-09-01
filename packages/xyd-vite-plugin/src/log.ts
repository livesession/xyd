const PREFIX = "[xyd]";

export interface Logger {
    info(msg: string): void;
    warn(msg: string): void;
    debug(msg: string): void;
    /** Prefix used for re-emitting the docs build's own output lines. */
    child(line: string): void;
}

export function createLogger(verbose: boolean): Logger {
    return {
        info: (msg) => console.log(`${PREFIX} ${msg}`),
        warn: (msg) => console.warn(`${PREFIX} ${msg}`),
        debug: (msg) => { if (verbose) console.log(`${PREFIX} ${msg}`); },
        child: (line) => console.log(`${PREFIX} │ ${line}`),
    };
}

/** A plugin-originated, already user-readable error (no stack noise needed). */
export class XydError extends Error {
    constructor(message: string) {
        super(`${PREFIX} ${message}`);
        this.name = "XydViteBuildError";
    }
}
