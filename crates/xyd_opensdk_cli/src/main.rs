//! Bin entry (`opensdk`) — the port of `src/cli.ts`.

fn main() {
    std::process::exit(xyd_opensdk_cli::command::main());
}
