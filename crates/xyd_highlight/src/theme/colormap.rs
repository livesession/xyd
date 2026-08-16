//! `ColorMap` (vscode-textmate class `X`) + the `from-css` remap.
//!
//! This is the make-or-break detail: ids are interned **uppercase, in
//! first-seen order** during theme parsing. Id `0` is reserved for "no color"
//! (`getId(null)`), the first real color gets id `1`, and so on. The resulting
//! `colors` array is what `tokenizer.ts::getStyle` indexes with a foreground id.

use std::collections::HashMap;

/// Interns color strings to stable numeric ids, exactly like vscode's
/// `ColorMap`. Not frozen — colors are discovered while parsing the theme
/// (the frozen/preseeded constructor form isn't used by syntax0's `setTheme`).
pub(crate) struct ColorMap {
    last_color_id: u32,
    /// `id2color[id]` — index 0 is the reserved "" placeholder (vscode leaves a
    /// hole that reads back as `undefined`; "" is the panic-free equivalent and
    /// is never indexed for a real foreground, whose lowest id is 1).
    id2color: Vec<String>,
    color2id: HashMap<String, u32>,
}

impl ColorMap {
    pub(crate) fn new() -> Self {
        Self {
            last_color_id: 0,
            id2color: vec![String::new()],
            color2id: HashMap::new(),
        }
    }

    /// `getId`: `None` → 0; otherwise uppercase and return the existing id or
    /// mint the next sequential one.
    pub(crate) fn get_id(&mut self, color: Option<&str>) -> u32 {
        let Some(color) = color else {
            return 0;
        };
        let upper = color.to_uppercase();
        if let Some(&id) = self.color2id.get(&upper) {
            return id;
        }
        self.last_color_id += 1;
        let id = self.last_color_id;
        self.color2id.insert(upper.clone(), id);
        // ids are strictly sequential, so a push keeps index == id.
        self.id2color.push(upper);
        id
    }

    /// `getColorMap`: the `colors` array (a copy), index-aligned with ids.
    pub(crate) fn get_color_map(&self) -> Vec<String> {
        self.id2color.clone()
    }
}

/// Port of `highlighter.ts::getColorMap`'s `from-css` step: rewrite each interned
/// color back to the original `colorNames` key whose `#00000N` placeholder it
/// matches (case-insensitively). Non-`from-css` themes never call this.
pub(crate) fn remap_color_names(
    color_map: Vec<String>,
    color_names: &HashMap<String, String>,
) -> Vec<String> {
    color_map
        .into_iter()
        .map(|c| {
            let cu = c.to_uppercase();
            // Placeholder values are unique, so at most one key matches.
            for (key, placeholder) in color_names {
                if placeholder.to_uppercase() == cu {
                    return key.clone();
                }
            }
            c
        })
        .collect()
}
