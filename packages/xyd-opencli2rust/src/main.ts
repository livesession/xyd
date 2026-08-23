// `src/main.rs` emission: the ~10-line wiring seam between the user-owned
// custom module and the generated CLI. Deliberately trivial so users never
// need to touch it (it stays generator-owned, writeMode overwrite).

import { GENERATED_HEADER } from './rslit';

export function renderMain(hasActions: boolean, moduleName = 'gen', implModule = 'custom'): string {
  if (hasActions) {
    return `${GENERATED_HEADER}

mod ${implModule};
mod ${moduleName};

#[tokio::main]
async fn main() -> std::process::ExitCode {
    let mut commands = ${moduleName}::runtime::CustomCommands::new();
    ${implModule}::register(&mut commands);
    let mut actions = ${moduleName}::runtime::Actions::new();
    ${moduleName}::runtime::bind::<${implModule}::Custom>(&mut actions);
    ${moduleName}::cli::run(${implModule}::overrides(), commands, actions).await
}
`;
  }
  return `${GENERATED_HEADER}

mod ${implModule};
mod ${moduleName};

#[tokio::main]
async fn main() -> std::process::ExitCode {
    let mut commands = ${moduleName}::runtime::CustomCommands::new();
    ${implModule}::register(&mut commands);
    ${moduleName}::cli::run(${implModule}::overrides(), commands).await
}
`;
}
