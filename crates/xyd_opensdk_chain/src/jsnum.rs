//! `JSON.stringify(value, null, 2)` in Rust.
//!
//! `serde_json`'s pretty printer already matches JS for layout, key order (with
//! `preserve_order`) and string escaping. The one place it does **not** match is
//! numbers: JS has a single `Number` type and prints it with the ECMA-262
//! `Number::toString` algorithm, so a spec containing `1.0` round-trips to `1`, `1e3`
//! to `1000`, `1e21` to `1e+21` and `-0` to `0`. `serde_json` would emit `1.0`,
//! `1000.0`, `1000000000000000000000.0` and `-0.0`.
//!
//! `processSource` writes its output with `JSON.stringify(doc, null, 2) + "\n"`, and
//! that file is a committed golden — so the number formatter is load-bearing.

use std::io;

use serde::Serialize;
use serde_json::ser::{Formatter, PrettyFormatter};
use serde_json::Value;

/// `JSON.stringify(value, null, 2)` (no trailing newline).
pub fn stringify_pretty(value: &Value) -> String {
    let mut out = Vec::new();
    let formatter = JsFormatter {
        inner: PrettyFormatter::with_indent(b"  "),
    };
    let mut ser = serde_json::Serializer::with_formatter(&mut out, formatter);
    value
        .serialize(&mut ser)
        .expect("serializing a Value to a Vec cannot fail");
    String::from_utf8(out).expect("serde_json emits UTF-8")
}

/// ECMA-262 `Number::toString(x, 10)` — what `JSON.stringify` prints for a finite
/// number. `NaN`/`Infinity` are unreachable here (JSON has no literal for them and
/// the YAML loader maps them to `null`), but are handled defensively as JS does when
/// stringifying: `null`.
pub fn number_to_string(x: f64) -> String {
    if x.is_nan() || x.is_infinite() {
        return "null".to_string();
    }
    if x == 0.0 {
        // JS: String(-0) === "0"
        return "0".to_string();
    }
    let neg = x < 0.0;
    let a = x.abs();

    // `{:e}` gives the shortest round-trip mantissa plus a base-10 exponent, i.e.
    // exactly the (digits, n) pair the spec algorithm is phrased in terms of.
    let sci = format!("{a:e}"); // e.g. "1.5e-9", "1e3"
    let (mantissa, exp) = sci.split_once('e').expect("{:e} always emits an exponent");
    let exp: i32 = exp.parse().expect("{:e} emits a decimal exponent");
    let digits: String = mantissa.chars().filter(|c| *c != '.').collect();
    let digits = digits.trim_end_matches('0');
    let digits = if digits.is_empty() { "0" } else { digits };
    let k = digits.len() as i32;
    let n = exp + 1; // value == 0.<digits> * 10^n

    let body = if k <= n && n <= 21 {
        // Integer with (n - k) trailing zeros.
        let mut s = String::from(digits);
        s.push_str(&"0".repeat((n - k) as usize));
        s
    } else if 0 < n && n <= 21 {
        format!("{}.{}", &digits[..n as usize], &digits[n as usize..])
    } else if -6 < n && n <= 0 {
        format!("0.{}{}", "0".repeat((-n) as usize), digits)
    } else {
        // Exponential form. The exponent printed is n - 1.
        let e = n - 1;
        let sign = if e >= 0 { '+' } else { '-' };
        let mag = e.abs();
        if k == 1 {
            format!("{digits}e{sign}{mag}")
        } else {
            format!("{}.{}e{}{}", &digits[..1], &digits[1..], sign, mag)
        }
    };

    if neg {
        format!("-{body}")
    } else {
        body
    }
}

/// `PrettyFormatter` with JS number semantics.
struct JsFormatter {
    inner: PrettyFormatter<'static>,
}

macro_rules! delegate {
    ($($name:ident($($arg:ident : $ty:ty),*);)*) => {
        $(
            #[inline]
            fn $name<W>(&mut self, w: &mut W $(, $arg: $ty)*) -> io::Result<()>
            where
                W: ?Sized + io::Write,
            {
                self.inner.$name(w $(, $arg)*)
            }
        )*
    };
}

impl Formatter for JsFormatter {
    fn write_f64<W>(&mut self, writer: &mut W, value: f64) -> io::Result<()>
    where
        W: ?Sized + io::Write,
    {
        writer.write_all(number_to_string(value).as_bytes())
    }

    fn write_f32<W>(&mut self, writer: &mut W, value: f32) -> io::Result<()>
    where
        W: ?Sized + io::Write,
    {
        writer.write_all(number_to_string(value as f64).as_bytes())
    }

    delegate! {
        begin_array();
        end_array();
        begin_array_value(first: bool);
        end_array_value();
        begin_object();
        end_object();
        begin_object_key(first: bool);
        end_object_key();
        begin_object_value();
        end_object_value();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_js_number_to_string() {
        // Values + expectations lifted from __oracle__/01.readraw-formats/output.json,
        // which is `JSON.stringify` output from Node.
        for (input, want) in [
            (1.0, "1"),
            (1000.0, "1000"),
            (-0.0, "0"),
            (1e21, "1e+21"),
            (1e-7, "1e-7"),
            (0.000001, "0.000001"),
            (1.5, "1.5"),
            (9007199254740991.0, "9007199254740991"),
            (-12.25, "-12.25"),
            (-1.5e-9, "-1.5e-9"),
            (1e20, "100000000000000000000"),
            (1e-6, "0.000001"),
            (123.456, "123.456"),
            (-1.0, "-1"),
            (0.1, "0.1"),
        ] {
            assert_eq!(number_to_string(input), want, "number_to_string({input})");
        }
    }

    #[test]
    fn empty_containers_match_json_stringify() {
        let v: Value = serde_json::from_str(r#"{"a":{},"b":[],"c":[1]}"#).unwrap();
        assert_eq!(
            stringify_pretty(&v),
            "{\n  \"a\": {},\n  \"b\": [],\n  \"c\": [\n    1\n  ]\n}"
        );
    }
}
