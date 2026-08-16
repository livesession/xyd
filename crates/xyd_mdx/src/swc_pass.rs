//! swc-AST post-pass on mdxjs's `Program.module`.
//!
//! Closes the one construct-level table divergence between mdxjs-rs and
//! `@mdx-js/mdx`: GFM table-cell alignment. mdxjs's `mdast_util_to_hast` emits
//! the HTML4 `align="left"` attribute on `<th>`/`<td>`; the JS pipeline
//! (mdast-util-to-hast's `tableCellAlignToStyle`) emits a React style OBJECT
//! `style={{ textAlign: "left" }}`, which renders as `style="text-align:left"`.
//!
//! A hast property can't hold an object (and mdxjs's hast->swc leaves `style`
//! as a string), so we fix it on the swc AST after codegen assembly: for every
//! `_jsx(_components.th|td, { align: "left"|"center"|"right", … })` call, replace
//! the `align` string prop with `style: { textAlign: "…" }`.

use swc_core::common::DUMMY_SP;
use swc_core::ecma::ast::{
    CallExpr, Expr, IdentName, KeyValueProp, Lit, MemberProp, ObjectLit, Prop, PropName,
    PropOrSpread, Str,
};
use swc_core::ecma::visit::{VisitMut, VisitMutWith};

/// Run the table-align-to-style pass over an swc module.
pub fn run(module: &mut swc_core::ecma::ast::Module) {
    let mut v = TableAlignToStyle;
    module.visit_mut_with(&mut v);
}

struct TableAlignToStyle;

impl VisitMut for TableAlignToStyle {
    fn visit_mut_call_expr(&mut self, call: &mut CallExpr) {
        call.visit_mut_children_with(self);

        if !first_arg_is_table_cell(call) {
            return;
        }
        // Props object is the second argument of `_jsx(comp, { … })`.
        if let Some(arg) = call.args.get_mut(1) {
            if let Expr::Object(obj) = &mut *arg.expr {
                convert_align_prop(obj);
            }
        }
    }
}

/// True when the call's first argument is a member access whose property is
/// `th` or `td` (i.e. `_components.th` / `_components.td`).
fn first_arg_is_table_cell(call: &CallExpr) -> bool {
    let Some(first) = call.args.first() else {
        return false;
    };
    if first.spread.is_some() {
        return false;
    }
    if let Expr::Member(member) = &*first.expr {
        if let MemberProp::Ident(IdentName { sym, .. }) = &member.prop {
            return sym == "th" || sym == "td";
        }
    }
    false
}

/// Replace `align: "<dir>"` with `style: { textAlign: "<dir>" }` in a props
/// object (only when `<dir>` is a known table alignment).
fn convert_align_prop(obj: &mut ObjectLit) {
    for prop in obj.props.iter_mut() {
        let PropOrSpread::Prop(boxed) = prop else {
            continue;
        };
        let Prop::KeyValue(kv) = &mut **boxed else {
            continue;
        };
        if prop_name_is(&kv.key, "align") {
            if let Expr::Lit(Lit::Str(Str { value, .. })) = &*kv.value {
                let dir = value.to_string();
                if matches!(dir.as_str(), "left" | "center" | "right") {
                    kv.key = PropName::Ident(IdentName::new("style".into(), DUMMY_SP));
                    *kv.value = style_object("textAlign", &dir);
                }
            }
        }
    }
}

fn prop_name_is(name: &PropName, want: &str) -> bool {
    match name {
        PropName::Ident(IdentName { sym, .. }) => sym == want,
        PropName::Str(Str { value, .. }) => value == want,
        _ => false,
    }
}

/// Build `{ <key>: "<value>" }`.
fn style_object(key: &str, value: &str) -> Expr {
    Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props: vec![PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
            key: PropName::Ident(IdentName::new(key.into(), DUMMY_SP)),
            value: Box::new(Expr::Lit(Lit::Str(Str {
                span: DUMMY_SP,
                value: value.into(),
                raw: None,
            }))),
        })))],
    })
}
