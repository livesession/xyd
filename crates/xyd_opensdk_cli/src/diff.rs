//! `src/cli/diff.ts` — diff two spec versions by SDK-consumer impact.

use std::io::Write;
use std::path::Path;
use std::str::FromStr;

use xyd_opensdk_diff::{diff_ir, IrDiff, IrSeverity};

use crate::error::{Error, Result};
use crate::generate::load_ir;
use crate::grouping::{converter_options, ConverterInputs};

/// Which severity gates a nonzero exit (see [`exit_code`]).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum DiffFailOn {
    #[default]
    Breaking,
    Risky,
    Any,
}

pub const FAIL_ON_VALUES: &[&str] = &["breaking", "risky", "any"];

impl FromStr for DiffFailOn {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self> {
        match s {
            "breaking" => Ok(DiffFailOn::Breaking),
            "risky" => Ok(DiffFailOn::Risky),
            "any" => Ok(DiffFailOn::Any),
            other => Err(Error::msg(format!(
                "Invalid --fail-on value: {other}. Expected one of: {}.",
                FAIL_ON_VALUES.join(", ")
            ))),
        }
    }
}

/// Report order: breaking first, then risky, then safe.
const SEVERITY_ORDER: [IrSeverity; 3] = [IrSeverity::Breaking, IrSeverity::Risky, IrSeverity::Safe];

fn severity_name(s: IrSeverity) -> &'static str {
    match s {
        IrSeverity::Breaking => "breaking",
        IrSeverity::Risky => "risky",
        IrSeverity::Safe => "safe",
    }
}

#[derive(Debug, Clone, Default)]
pub struct DiffCommandOptions {
    pub inputs: ConverterInputs,
    pub base: String,
    pub head: String,
    /// Print the machine-readable IrDiff JSON instead of the grouped report.
    pub json: bool,
    pub fail_on: DiffFailOn,
}

/// `opensdk diff <base> <head>` — convert BOTH sides through the SAME converter
/// options (so spec-external remounts never show up as false method renames),
/// diff the IRs, and report changes grouped by SDK-consumer impact.
///
/// Returns the process exit code.
pub fn diff_command(opts: &DiffCommandOptions, cwd: &Path) -> Result<i32> {
    let options = converter_options(&opts.inputs, cwd)?;
    let base = load_ir(&opts.base, &options)?;
    let head = load_ir(&opts.head, &options)?;
    let diff = diff_ir(&base, &head);

    if opts.json {
        let mut stdout = std::io::stdout();
        let payload = serde_json::to_string_pretty(&diff).map_err(|e| Error::msg(e.to_string()))?;
        let _ = stdout.write_all(format!("{payload}\n").as_bytes());
        let _ = stdout.flush();
    } else {
        print!("{}", render_report(&diff));
    }
    Ok(exit_code(&diff, opts.fail_on))
}

/// The 0/1/2 trichotomy: 2 = breaking present, 1 = risky present, 0 = safe only
/// or no changes. `--fail-on any` additionally exits 1 when only safe changes
/// exist; `risky` matches the default table (risky already exits nonzero).
pub fn exit_code(diff: &IrDiff, fail_on: DiffFailOn) -> i32 {
    let has = |s: IrSeverity| diff.changes.iter().any(|c| c.severity == s);
    if has(IrSeverity::Breaking) {
        return 2;
    }
    if has(IrSeverity::Risky) {
        return 1;
    }
    if fail_on == DiffFailOn::Any && !diff.changes.is_empty() {
        return 1;
    }
    0
}

/// The grouped human-readable report, as ONE string.
///
/// Rendered rather than printed so the oracle can compare it byte for byte. Each
/// TS `console.log(x)` is one `x\n`; the trailing `console.log('')` after a
/// group is a bare newline.
pub fn render_report(diff: &IrDiff) -> String {
    if diff.changes.is_empty() {
        return "No changes.\n".to_string();
    }
    let mut out = String::new();
    let count = |s: IrSeverity| diff.changes.iter().filter(|c| c.severity == s).count();
    for severity in SEVERITY_ORDER {
        let changes: Vec<_> = diff
            .changes
            .iter()
            .filter(|c| c.severity == severity)
            .collect();
        if changes.is_empty() {
            continue;
        }
        out.push_str(&format!(
            "{} ({})\n",
            severity_name(severity).to_uppercase(),
            changes.len()
        ));
        for c in changes {
            out.push_str(&format!("  {}  {} — {}\n", c.kind, c.path, c.detail));
        }
        out.push('\n');
    }
    let total = diff.changes.len();
    out.push_str(&format!(
        "{} breaking, {} risky, {} safe ({total} change{})\n",
        count(IrSeverity::Breaking),
        count(IrSeverity::Risky),
        count(IrSeverity::Safe),
        if total == 1 { "" } else { "s" }
    ));
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use xyd_opensdk_diff::IrChange;

    fn change(severity: IrSeverity, kind: &str) -> IrChange {
        IrChange {
            severity,
            kind: kind.into(),
            path: "pets.list".into(),
            detail: "detail".into(),
        }
    }

    #[test]
    fn no_changes_reports_and_exits_zero() {
        let diff = IrDiff::default();
        assert_eq!(render_report(&diff), "No changes.\n");
        assert_eq!(exit_code(&diff, DiffFailOn::Breaking), 0);
        // `--fail-on any` with NO changes is still 0.
        assert_eq!(exit_code(&diff, DiffFailOn::Any), 0);
    }

    #[test]
    fn severity_gates_the_exit_code() {
        let safe = IrDiff {
            changes: vec![change(IrSeverity::Safe, "param-added")],
        };
        assert_eq!(exit_code(&safe, DiffFailOn::Breaking), 0);
        assert_eq!(exit_code(&safe, DiffFailOn::Risky), 0);
        assert_eq!(exit_code(&safe, DiffFailOn::Any), 1);

        let risky = IrDiff {
            changes: vec![change(IrSeverity::Risky, "deprecated-added")],
        };
        assert_eq!(exit_code(&risky, DiffFailOn::Breaking), 1);

        let breaking = IrDiff {
            changes: vec![change(IrSeverity::Breaking, "method-removed")],
        };
        assert_eq!(exit_code(&breaking, DiffFailOn::Breaking), 2);
    }

    #[test]
    fn grouped_report_orders_breaking_risky_safe_with_a_counts_line() {
        let diff = IrDiff {
            changes: vec![
                change(IrSeverity::Safe, "param-added"),
                change(IrSeverity::Breaking, "method-removed"),
                change(IrSeverity::Risky, "deprecated-added"),
            ],
        };
        assert_eq!(
            render_report(&diff),
            "BREAKING (1)\n  method-removed  pets.list — detail\n\n\
             RISKY (1)\n  deprecated-added  pets.list — detail\n\n\
             SAFE (1)\n  param-added  pets.list — detail\n\n\
             1 breaking, 1 risky, 1 safe (3 changes)\n"
        );
    }

    #[test]
    fn a_single_change_is_not_pluralised() {
        let diff = IrDiff {
            changes: vec![change(IrSeverity::Breaking, "method-removed")],
        };
        assert!(render_report(&diff).ends_with("1 breaking, 0 risky, 0 safe (1 change)\n"));
    }

    #[test]
    fn invalid_fail_on_is_rejected_with_the_valid_set() {
        assert_eq!(
            DiffFailOn::from_str("oops").unwrap_err().0,
            "Invalid --fail-on value: oops. Expected one of: breaking, risky, any."
        );
    }
}
