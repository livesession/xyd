// `src/main.rs` emission: the ~10-line wiring seam between the user-owned
// custom module and the generated CLI. Deliberately trivial so users never
// need to touch it (it stays generator-owned, writeMode overwrite).

import { GENERATED_HEADER } from './rslit';

export function renderMain(): string {
  return `${GENERATED_HEADER}

mod custom;
mod gen;

#[tokio::main]
async fn main() -> std::process::ExitCode {
    let mut commands = gen::runtime::CustomCommands::new();
    custom::register(&mut commands);
    gen::cli::run(custom::overrides(), commands).await
}
`;
}
