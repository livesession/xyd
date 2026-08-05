//! Dev tool: dump `compile_mdx`'s capability + raw function-body for a fixture
//! dir (containing `input.mdx` [+ optional `settings.json`]). Not part of the
//! napi addon. Usage:
//!   cargo run -q --example dump -- <fixture-dir>
fn main() {
    let dir = std::env::args().nth(1).expect("usage: dump <fixture-dir>");
    let source = std::fs::read_to_string(format!("{dir}/input.mdx")).unwrap();
    let settings =
        std::fs::read_to_string(format!("{dir}/settings.json")).unwrap_or_else(|_| "{}".into());
    let out = xyd_mdx::compile_mdx(&source, &settings, &dir);
    eprintln!("CAPABILITY={} reason={:?}", out.capability, out.reason);
    print!("{}", out.compiled);
}
