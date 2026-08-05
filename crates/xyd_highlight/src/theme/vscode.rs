//! VS Code theme normalization — port of `toFinalTheme` + `getThemeType` from
//! `syntax0-highlight/src/theme.ts`. Turns a `RawTheme` into a `FinalTheme` the
//! rule parser consumes: pick the settings array, resolve the theme type,
//! extract (or synthesize) the global fg/bg, and — for `from-css` themes —
//! remap every rule color to a `#00000N` placeholder recorded in `colorNames`.

use std::collections::HashMap;

use super::defaults::get_color;
use super::model::{FinalTheme, FinalType, RawTheme, SettingBody, ThemeSetting};

/// `getThemeType`: `from-css` stays itself; any explicit non-`light` type (or a
/// name lacking "light") is `dark`.
fn get_theme_type(raw: &RawTheme) -> FinalType {
    if raw.ty.as_deref() == Some("from-css") {
        return FinalType::FromCss;
    }
    let theme_type = match &raw.ty {
        Some(t) => t.clone(),
        None => {
            if raw
                .name
                .as_ref()
                .is_some_and(|n| n.to_lowercase().contains("light"))
            {
                "light".to_string()
            } else {
                "dark".to_string()
            }
        }
    };
    if theme_type == "light" {
        FinalType::Light
    } else {
        FinalType::Dark
    }
}

/// `toFinalTheme`: normalize a raw VS Code theme into a `FinalTheme`.
pub(crate) fn to_final_theme(raw: &RawTheme) -> FinalTheme {
    let settings = raw
        .settings
        .clone()
        .or_else(|| raw.token_colors.clone())
        .unwrap_or_default();

    // Keep only string-valued colors — theme JSON may carry array-valued keys
    // that our lookups never touch.
    let colors: HashMap<String, String> = raw
        .colors
        .clone()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|(k, v)| v.as_str().map(|s| (k, s.to_string())))
        .collect();

    let mut theme = FinalTheme {
        name: raw
            .name
            .clone()
            .unwrap_or_else(|| "unknown-theme".to_string()),
        ty: get_theme_type(raw),
        foreground: String::new(),
        background: String::new(),
        settings,
        colors,
        color_names: raw.color_names.clone(),
    };

    // The global setting is the (first) rule with no scope.
    let global = theme.settings.iter().find(|s| s.scope.is_none()).cloned();

    match global {
        Some(g) => {
            let body = g.settings.clone().unwrap_or_default();
            if let Some(fg) = &body.foreground {
                theme
                    .colors
                    .entry("editor.foreground".to_string())
                    .or_insert_with(|| fg.clone());
            }
            if let Some(bg) = &body.background {
                theme
                    .colors
                    .entry("editor.background".to_string())
                    .or_insert_with(|| bg.clone());
            }
            theme.foreground = body.foreground.clone().unwrap_or_default();
            theme.background = body.background.clone().unwrap_or_default();
        }
        None => {
            // No global rule: synthesize one from the editor fg/bg and prepend it.
            let fg = get_color(&theme, "editor.foreground").unwrap_or_default();
            let bg = get_color(&theme, "editor.background").unwrap_or_default();
            let mut new_settings = Vec::with_capacity(theme.settings.len() + 1);
            new_settings.push(ThemeSetting {
                name: None,
                scope: None,
                settings: Some(SettingBody {
                    font_style: None,
                    foreground: Some(fg),
                    background: Some(bg),
                }),
            });
            new_settings.append(&mut theme.settings);
            theme.settings = new_settings;
        }
    }

    if theme.background.is_empty() {
        theme.background = get_color(&theme, "editor.background").unwrap_or_default();
    }
    if theme.foreground.is_empty() {
        theme.foreground = get_color(&theme, "editor.foreground").unwrap_or_default();
    }

    if raw.ty.as_deref() == Some("from-css") && theme.color_names.is_none() {
        apply_from_css_color_names(&mut theme);
    }

    theme
}

/// `from-css` remap: assign each distinct rule color a sequential `#00000N`
/// placeholder (foreground before background, in setting order) and rewrite the
/// rule bodies to reference it. The mapping is stored in `color_names` and later
/// reversed by `remap_color_names` when building the public color map.
fn apply_from_css_color_names(theme: &mut FinalTheme) {
    let mut color_names: HashMap<String, String> = HashMap::new();
    let mut counter = 0u32;

    let mut new_settings = Vec::with_capacity(theme.settings.len());
    for setting in &theme.settings {
        let mut body = setting.settings.clone().unwrap_or_default();
        let fg = body.foreground.clone();
        let bg = body.background.clone();

        if let Some(f) = &fg {
            if !color_names.contains_key(f) {
                color_names.insert(f.clone(), format!("#{counter:06x}"));
                counter += 1;
            }
        }
        if let Some(b) = &bg {
            if !color_names.contains_key(b) {
                color_names.insert(b.clone(), format!("#{counter:06x}"));
                counter += 1;
            }
        }
        if let Some(f) = &fg {
            body.foreground = Some(color_names[f].clone());
        }
        if let Some(b) = &bg {
            body.background = Some(color_names[b].clone());
        }

        new_settings.push(ThemeSetting {
            name: setting.name.clone(),
            scope: setting.scope.clone(),
            settings: Some(body),
        });
    }

    theme.settings = new_settings;
    theme.color_names = Some(color_names);
}
