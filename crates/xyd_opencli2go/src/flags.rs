//! Flag rendering — port of flags.ts.

use crate::golit::{go_bool, go_slice, go_str, go_struct, GoVal};
use crate::model::FlagModel;

pub fn render_flag(f: &FlagModel) -> GoVal {
    let type_name = format!("cli.{}", f.go_type.flag_type());
    let mut fields: Vec<(String, GoVal)> = vec![("Name".to_string(), go_str(&f.flag_name))];
    if !f.aliases.is_empty() {
        let aliases = f.aliases.iter().map(|a| go_str(a)).collect();
        fields.push(("Aliases".to_string(), go_slice("string", aliases)));
    }
    if let Some(desc) = &f.description {
        fields.push(("Usage".to_string(), go_str(desc)));
    }
    if f.required {
        fields.push(("Required".to_string(), go_bool(true)));
    }
    if f.hidden {
        fields.push(("Hidden".to_string(), go_bool(true)));
    }
    go_struct(&type_name, fields, true)
}

pub fn render_flags(flags: &[FlagModel]) -> Vec<GoVal> {
    flags.iter().map(render_flag).collect()
}
