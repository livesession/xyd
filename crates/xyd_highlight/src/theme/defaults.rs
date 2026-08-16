//! Port of `syntax0-highlight/src/theme-colors.ts`: the VS Code default color
//! table + `getColor` / `getColorScheme` + the `transparent()` helper (from
//! `color.ts`). Used by `toFinalTheme` (to source global fg/bg) and by
//! `getAllThemeColors` (CSS-variable extraction).
//!
//! `getThemeType` collapses `hc` into `dark`, so the `hc` scheme values in the
//! upstream table are never selected — they are omitted here.

use super::model::FinalTheme;
use super::model::FinalType;

/// A per-scheme default value: a literal color or a `transparent(key, opacity)`
/// derivation of another color key.
enum SchemeVal {
    Color(&'static str),
    Transparent(&'static str, f64),
}

/// Dark/light defaults for one color key (the reachable subset of the upstream
/// `{dark,light,hc}` object). An empty object upstream → both `None`.
struct Scheme {
    dark: Option<SchemeVal>,
    light: Option<SchemeVal>,
}

/// A default-table entry: either an alias to another key or a per-scheme block.
enum DefaultEntry {
    Alias(&'static str),
    Scheme(Scheme),
}

fn color(c: &'static str) -> Option<SchemeVal> {
    Some(SchemeVal::Color(c))
}

/// Look up a color key in the default table (`defaults` in `theme-colors.ts`).
fn lookup_default(name: &str) -> Option<DefaultEntry> {
    let scheme = |dark, light| Some(DefaultEntry::Scheme(Scheme { dark, light }));
    let both = |c: &'static str| scheme(color(c), color(c));
    match name {
        "editor.foreground" => scheme(color("#bbbbbb"), color("#333333")),
        "editorLineNumber.foreground" => scheme(color("#858585"), color("#237893")),
        "editor.selectionBackground" => scheme(color("#264F78"), color("#ADD6FF")),
        "editor.background" => scheme(color("#1E1E1E"), color("#fffffe")),
        "editorGroupHeader.tabsBackground" => scheme(color("#252526"), color("#F3F3F3")),
        "tab.activeBackground" => Some(DefaultEntry::Alias("editor.background")),
        "tab.activeForeground" => scheme(color("#ffffff"), color("#333333")),
        "tab.border" => scheme(color("#252526"), color("#F3F3F3")),
        "tab.activeBorder" => Some(DefaultEntry::Alias("tab.activeBackground")),
        "tab.inactiveBackground" => scheme(color("#2D2D2D"), color("#ECECEC")),
        "tab.inactiveForeground" => scheme(
            Some(SchemeVal::Transparent("tab.activeForeground", 0.5)),
            Some(SchemeVal::Transparent("tab.activeForeground", 0.5)),
        ),
        "diffEditor.insertedTextBackground" => scheme(color("#9ccc2c33"), color("#9ccc2c40")),
        "diffEditor.removedTextBackground" => both("#ff000033"),
        "diffEditor.insertedLineBackground" => both("#9bb95533"),
        "diffEditor.removedLineBackground" => both("#ff000033"),
        "icon.foreground" => scheme(color("#C5C5C5"), color("#424242")),
        "sideBar.background" => scheme(color("#252526"), color("#F3F3F3")),
        "sideBar.foreground" => Some(DefaultEntry::Alias("editor.foreground")),
        "sideBar.border" => Some(DefaultEntry::Alias("sideBar.background")),
        "list.inactiveSelectionBackground" => scheme(color("#37373D"), color("#E4E6F1")),
        "list.inactiveSelectionForeground" => scheme(None, None),
        "list.hoverBackground" => scheme(color("#2A2D2E"), color("#F0F0F0")),
        "list.hoverForeground" => scheme(None, None),
        "editorGroupHeader.tabsBorder" => scheme(None, None),
        "tab.activeBorderTop" => scheme(None, None),
        "tab.hoverBackground" => Some(DefaultEntry::Alias("tab.inactiveBackground")),
        "tab.hoverForeground" => Some(DefaultEntry::Alias("tab.inactiveForeground")),
        "editor.rangeHighlightBackground" => scheme(color("#ffffff0b"), color("#fdff0033")),
        "editor.infoForeground" => scheme(color("#3794FF"), color("#1a85ff")),
        "input.border" => scheme(None, None),
        "input.background" => scheme(color("#3C3C3C"), color("#fffffe")),
        "input.foreground" => Some(DefaultEntry::Alias("editor.foreground")),
        "editor.lineHighlightBackground" => scheme(None, None),
        "focusBorder" => scheme(color("#007FD4"), color("#0090F1")),
        "editorGroup.border" => scheme(color("#444444"), color("#E7E7E7")),
        "list.activeSelectionBackground" => scheme(color("#094771"), color("#0060C0")),
        "list.activeSelectionForeground" => both("#fffffe"),
        "lighter.inlineBackground" => scheme(
            Some(SchemeVal::Transparent("editor.background", 0.9)),
            Some(SchemeVal::Transparent("editor.background", 0.9)),
        ),

        // terminal colors
        "terminal.background" => Some(DefaultEntry::Alias("editor.background")),
        "terminal.foreground" => Some(DefaultEntry::Alias("editor.foreground")),
        "terminal.ansiBlack" => both("#000000"),
        "terminal.ansiRed" => both("#cd3131"),
        "terminal.ansiGreen" => scheme(color("#0DBC79"), color("#00BC00")),
        "terminal.ansiYellow" => scheme(color("#e5e510"), color("#949800")),
        "terminal.ansiBlue" => scheme(color("#2472c8"), color("#0451a5")),
        "terminal.ansiMagenta" => scheme(color("#bc3fbc"), color("#bc05bc")),
        "terminal.ansiCyan" => scheme(color("#11a8cd"), color("#0598bc")),
        "terminal.ansiWhite" => scheme(color("#e5e5e5"), color("#555555")),
        "terminal.ansiBrightBlack" => both("#666666"),
        "terminal.ansiBrightRed" => scheme(color("#f14c4c"), color("#cd3131")),
        "terminal.ansiBrightGreen" => scheme(color("#23d18b"), color("#14CE14")),
        "terminal.ansiBrightYellow" => scheme(color("#f5f543"), color("#b5ba00")),
        "terminal.ansiBrightBlue" => scheme(color("#3b8eea"), color("#0451a5")),
        "terminal.ansiBrightMagenta" => scheme(color("#d670d6"), color("#bc05bc")),
        "terminal.ansiBrightCyan" => scheme(color("#29b8db"), color("#0598bc")),
        "terminal.ansiBrightWhite" => scheme(color("#e5e5e5"), color("#a5a5a5")),
        _ => None,
    }
}

/// `getColorScheme`: `from-css` → the CSS variable; otherwise the scheme name.
pub(crate) fn get_color_scheme(theme: &FinalTheme) -> String {
    match theme.ty {
        FinalType::FromCss => "var(--ch-0)".to_string(),
        FinalType::Dark => "dark".to_string(),
        FinalType::Light => "light".to_string(),
    }
}

/// `getColor`: explicit `colors[name]` wins; otherwise resolve the default table
/// (aliases recurse; per-scheme values may derive via `transparent`). Unknown
/// keys (upstream throws) and unresolved scheme values return `None`.
pub(crate) fn get_color(theme: &FinalTheme, name: &str) -> Option<String> {
    if let Some(c) = theme.colors.get(name) {
        return Some(c.clone());
    }
    match lookup_default(name)? {
        DefaultEntry::Alias(target) => get_color(theme, target),
        DefaultEntry::Scheme(scheme) => resolve_scheme(theme, &scheme),
    }
}

fn resolve_scheme(theme: &FinalTheme, scheme: &Scheme) -> Option<String> {
    let val = match theme.ty {
        FinalType::Dark => scheme.dark.as_ref(),
        FinalType::Light => scheme.light.as_ref(),
        // `defaults["from-css"]` is undefined upstream → no default.
        FinalType::FromCss => None,
    }?;
    match val {
        SchemeVal::Color(c) => Some(c.to_string()),
        SchemeVal::Transparent(key, opacity) => {
            let base = get_color(theme, key)?;
            transparent(&base, *opacity)
        }
    }
}

/// `transparent(color, opacity)` (`color.ts`): parse the hex, scale its alpha by
/// `opacity`, re-emit as `#rrggbbaa` (lowercase). Returns `None` if `color`
/// isn't a hex string.
pub(crate) fn transparent(color: &str, opacity: f64) -> Option<String> {
    let (r, g, b, a) = hex_to_rgba(color)?;
    Some(rgba_to_hex(r, g, b, a * opacity))
}

fn hex_to_rgba(hex: &str) -> Option<(u32, u32, u32, f64)> {
    let body = hex.strip_prefix('#')?;
    let chunk = (hex.len() - 1) / 3; // floor((len-1)/3): 1 for #rgb(a), 2 for #rrggbb(aa)
    if chunk == 0 {
        return None;
    }
    let mut parts: Vec<u32> = Vec::with_capacity(4);
    let mut i = 0;
    while i + chunk <= body.len() {
        let piece = &body[i..i + chunk];
        // convertHexUnitTo256: 1-char units are doubled ("f" → "ff").
        let expanded = if chunk == 1 {
            format!("{piece}{piece}")
        } else {
            piece.to_string()
        };
        parts.push(u32::from_str_radix(&expanded, 16).ok()?);
        i += chunk;
    }
    let r = *parts.first()?;
    let g = *parts.get(1)?;
    let b = *parts.get(2)?;
    let a = parts.get(3).map_or(1.0, |v| f64::from(*v) / 255.0);
    Some((r, g, b, a))
}

fn rgba_to_hex(r: u32, g: u32, b: u32, a: f64) -> String {
    // Math.round: ties round to the larger magnitude (matches JS for a in [0,1]).
    let alpha = (a * 255.0).round() as u32;
    format!("#{r:02x}{g:02x}{b:02x}{alpha:02x}")
}
