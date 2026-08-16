//! `cmd/<bin>/main.go` rendering — port of main.ts.

use serde_json::Value;

use crate::golit::{go_file, go_slice, go_str, go_struct, lit, GoVal, Imports};

const CLI: &str = "github.com/urfave/cli/v3";

pub fn render_main(spec: &Value, bin_name: &str, module: &str, constructors: &[String]) -> String {
    let mut imports = Imports::new();
    imports.add(&["context", "log", "os", CLI, &format!("{module}/pkg/cmd")]);

    let info = spec.get("info");
    let mut fields: Vec<(String, GoVal)> = vec![("Name".to_string(), go_str(bin_name))];

    // usage = info.summary || info.description (first truthy).
    let usage = info
        .and_then(|i| i.get("summary"))
        .and_then(|s| s.as_str())
        .filter(|s| !s.is_empty())
        .or_else(|| {
            info.and_then(|i| i.get("description"))
                .and_then(|s| s.as_str())
                .filter(|s| !s.is_empty())
        });
    if let Some(usage) = usage {
        fields.push(("Usage".to_string(), go_str(usage)));
    }
    if let Some(version) = info
        .and_then(|i| i.get("version"))
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
    {
        fields.push(("Version".to_string(), go_str(version)));
    }
    let cmds: Vec<GoVal> = constructors
        .iter()
        .map(|c| lit(format!("cmd.{c}()")))
        .collect();
    fields.push(("Commands".to_string(), go_slice("*cli.Command", cmds)));

    let app = go_struct("cli.Command", fields, true);
    let body = format!(
        "\tapp := {}\n\tif err := app.Run(context.Background(), os.Args); err != nil {{\n\t\tlog.Fatal(err)\n\t}}",
        app(1)
    );
    let func = format!("func main() {{\n{body}\n}}");
    go_file("main", &imports, &[func])
}
