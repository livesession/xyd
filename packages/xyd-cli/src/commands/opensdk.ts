import { runOpensdk } from '../components/opensdk';

/**
 * `xyd opensdk <anything>` — passthrough to the optionally-installed opensdk
 * toolchain (`xyd components install opensdk`). Receives the RAW argv after
 * `opensdk` (never parsed by `arg`: opensdk's own flags like `--lang` would be
 * rejected as unknown), and never returns (exit code propagates).
 */
export async function opensdk(args: string[]): Promise<void> {
    runOpensdk(args);
}
