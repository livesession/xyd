//! A tiny, self-contained parser for the well-formed MathML `pulldown-latex`
//! emits, into a generic [`MathNode`] tree.
//!
//! Two consumers:
//!   1. `xyd_mdx` maps a [`MathNode`] tree onto `mdxjs::hast` nodes (so math
//!      renders as real React elements in the MDX pipeline — mirroring how
//!      `rehype-katex` parses KaTeX HTML into hast). This crate stays
//!      mdxjs-free; the hast mapping lives in `xyd_mdx/src/math.rs`.
//!   2. The equivalence metric ([`crate::equiv`]) extracts token/structure
//!      shape from a `MathNode` tree — applied to BOTH our output and the
//!      committed KaTeX reference MathML, so the comparison uses ONE parser.
//!
//! Scope: this parses exactly the shape `pulldown-latex` produces — elements,
//! double-quoted attributes, text, self-closing tags (`<mspace … />`), and the
//! XML entities `&amp; &lt; &gt; &quot; &apos; &#DDD; &#xHHH;`. It is NOT a
//! general XML parser (no namespaces beyond the literal `xmlns` attribute, no
//! CDATA, no processing instructions) — it does not need to be.

/// A parsed MathML node: an element (tag + attributes + children) or text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MathNode {
    Element {
        tag: String,
        attrs: Vec<(String, String)>,
        children: Vec<MathNode>,
    },
    Text(String),
}

impl MathNode {
    /// The element tag name, or `None` for text.
    pub fn tag(&self) -> Option<&str> {
        match self {
            MathNode::Element { tag, .. } => Some(tag.as_str()),
            MathNode::Text(_) => None,
        }
    }

    /// Concatenated text of this subtree (leaf text joined in document order).
    pub fn text_content(&self) -> String {
        let mut s = String::new();
        collect_text(self, &mut s);
        s
    }
}

fn collect_text(node: &MathNode, out: &mut String) {
    match node {
        MathNode::Text(t) => out.push_str(t),
        MathNode::Element { children, .. } => {
            for c in children {
                collect_text(c, out);
            }
        }
    }
}

/// Error parsing a MathML string.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MathParseError(pub String);

impl std::fmt::Display for MathParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "mathml parse error: {}", self.0)
    }
}

impl std::error::Error for MathParseError {}

/// Parse a MathML string (the output of [`crate::latex_to_mathml`], or KaTeX's
/// `.katex-mathml` `<math>` subtree) into a single root [`MathNode`].
pub fn parse_mathml(input: &str) -> Result<MathNode, MathParseError> {
    let mut p = XmlParser {
        bytes: input.as_bytes(),
        pos: 0,
        src: input,
    };
    p.skip_ws_and_prolog();
    let node = p.parse_element()?;
    p.skip_ws();
    Ok(node)
}

struct XmlParser<'a> {
    bytes: &'a [u8],
    pos: usize,
    src: &'a str,
}

impl<'a> XmlParser<'a> {
    fn peek(&self) -> Option<u8> {
        self.bytes.get(self.pos).copied()
    }

    fn starts_with(&self, s: &str) -> bool {
        self.src[self.pos..].starts_with(s)
    }

    /// At a `<`, does a real tag/markup start? (next byte is a name-start letter
    /// or one of `/ ! ?`). Otherwise the `<` is literal character data.
    fn is_markup_start(&self) -> bool {
        matches!(
            self.bytes.get(self.pos + 1),
            Some(b'/' | b'!' | b'?' | b'a'..=b'z' | b'A'..=b'Z')
        )
    }

    fn skip_ws(&mut self) {
        while matches!(self.peek(), Some(b' ' | b'\t' | b'\n' | b'\r')) {
            self.pos += 1;
        }
    }

    /// Skip leading whitespace, XML declarations (`<?…?>`), comments
    /// (`<!--…-->`), and doctypes (`<!…>`) before the root element.
    fn skip_ws_and_prolog(&mut self) {
        loop {
            self.skip_ws();
            if self.starts_with("<?") {
                if let Some(end) = self.src[self.pos..].find("?>") {
                    self.pos += end + 2;
                    continue;
                }
            } else if self.starts_with("<!--") {
                if let Some(end) = self.src[self.pos..].find("-->") {
                    self.pos += end + 3;
                    continue;
                }
            } else if self.starts_with("<!") {
                if let Some(end) = self.src[self.pos..].find('>') {
                    self.pos += end + 1;
                    continue;
                }
            }
            break;
        }
    }

    fn parse_element(&mut self) -> Result<MathNode, MathParseError> {
        if self.peek() != Some(b'<') {
            return Err(MathParseError(format!("expected '<' at byte {}", self.pos)));
        }
        self.pos += 1; // consume '<'
        let tag = self.parse_name()?;
        let mut attrs = Vec::new();
        loop {
            self.skip_ws();
            match self.peek() {
                Some(b'/') => {
                    // self-closing
                    self.pos += 1;
                    if self.peek() != Some(b'>') {
                        return Err(MathParseError("expected '>' after '/'".into()));
                    }
                    self.pos += 1;
                    return Ok(MathNode::Element {
                        tag,
                        attrs,
                        children: Vec::new(),
                    });
                }
                Some(b'>') => {
                    self.pos += 1;
                    break;
                }
                Some(_) => {
                    let (k, v) = self.parse_attribute()?;
                    attrs.push((k, v));
                }
                None => return Err(MathParseError("unexpected EOF in start tag".into())),
            }
        }
        // children until matching close tag
        let mut children = Vec::new();
        loop {
            match self.peek() {
                None => return Err(MathParseError(format!("unclosed <{tag}>"))),
                Some(b'<') => {
                    if self.starts_with("</") {
                        self.pos += 2;
                        let close = self.parse_name()?;
                        self.skip_ws();
                        if self.peek() != Some(b'>') {
                            return Err(MathParseError("expected '>' in close tag".into()));
                        }
                        self.pos += 1;
                        if close != tag {
                            return Err(MathParseError(format!(
                                "mismatched close: <{tag}> vs </{close}>"
                            )));
                        }
                        break;
                    } else if self.starts_with("<!--") {
                        let end = self.src[self.pos..]
                            .find("-->")
                            .ok_or_else(|| MathParseError("unterminated comment".into()))?;
                        self.pos += end + 3;
                    } else if self.is_markup_start() {
                        children.push(self.parse_element()?);
                    } else {
                        // A literal '<' in character data. `pulldown-latex` emits
                        // the `<` operator UNESCAPED (`<mo><</mo>`), which is not
                        // well-formed XML; tolerate it as text so `$x < 0$` works
                        // (a strict parser would reject the page and force a
                        // needless JS fallback).
                        self.pos += 1;
                        children.push(MathNode::Text("<".into()));
                    }
                }
                Some(_) => {
                    let text = self.parse_text();
                    if !text.is_empty() {
                        children.push(MathNode::Text(text));
                    }
                }
            }
        }
        Ok(MathNode::Element {
            tag,
            attrs,
            children,
        })
    }

    fn parse_name(&mut self) -> Result<String, MathParseError> {
        let start = self.pos;
        while let Some(c) = self.peek() {
            match c {
                b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b':' | b'.' => {
                    self.pos += 1;
                }
                _ => break,
            }
        }
        if self.pos == start {
            return Err(MathParseError(format!("empty name at byte {}", self.pos)));
        }
        Ok(self.src[start..self.pos].to_string())
    }

    fn parse_attribute(&mut self) -> Result<(String, String), MathParseError> {
        let name = self.parse_name()?;
        self.skip_ws();
        if self.peek() != Some(b'=') {
            // valueless attribute (rare in MathML; treat value as empty)
            return Ok((name, String::new()));
        }
        self.pos += 1; // '='
        self.skip_ws();
        let quote = self.peek();
        if quote != Some(b'"') && quote != Some(b'\'') {
            return Err(MathParseError(format!(
                "expected quote for attribute '{name}'"
            )));
        }
        let q = quote.unwrap();
        self.pos += 1;
        let start = self.pos;
        while let Some(c) = self.peek() {
            if c == q {
                break;
            }
            self.pos += 1;
        }
        if self.peek() != Some(q) {
            return Err(MathParseError(format!("unterminated attribute '{name}'")));
        }
        let raw = &self.src[start..self.pos];
        self.pos += 1; // closing quote
        Ok((name, unescape(raw)))
    }

    /// Parse a run of character data up to the next `<`.
    fn parse_text(&mut self) -> String {
        let start = self.pos;
        while let Some(c) = self.peek() {
            if c == b'<' {
                break;
            }
            self.pos += 1;
        }
        unescape(&self.src[start..self.pos])
    }
}

/// Unescape the XML entities `pulldown-latex`/KaTeX emit.
fn unescape(s: &str) -> String {
    if !s.contains('&') {
        return s.to_string();
    }
    let mut out = String::with_capacity(s.len());
    let mut rest = s;
    while let Some(amp) = rest.find('&') {
        out.push_str(&rest[..amp]);
        let tail = &rest[amp..];
        if let Some(semi) = tail.find(';') {
            let ent = &tail[1..semi];
            let replaced = match ent {
                "amp" => Some('&'),
                "lt" => Some('<'),
                "gt" => Some('>'),
                "quot" => Some('"'),
                "apos" => Some('\''),
                // `pulldown-latex` uses `&nbsp;` for `\text{ … }` spacing (an
                // HTML, not XML, entity). Map it so text-mode compares cleanly.
                "nbsp" => Some('\u{00A0}'),
                _ => {
                    if let Some(hex) = ent.strip_prefix("#x").or_else(|| ent.strip_prefix("#X")) {
                        u32::from_str_radix(hex, 16).ok().and_then(char::from_u32)
                    } else if let Some(dec) = ent.strip_prefix('#') {
                        dec.parse::<u32>().ok().and_then(char::from_u32)
                    } else {
                        None
                    }
                }
            };
            match replaced {
                Some(c) => {
                    out.push(c);
                    rest = &tail[semi + 1..];
                }
                None => {
                    // Unknown entity — keep literally.
                    out.push('&');
                    rest = &tail[1..];
                }
            }
        } else {
            out.push('&');
            rest = &tail[1..];
        }
    }
    out.push_str(rest);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_nested_and_selfclosing() {
        let ml = r#"<math display="block"><mrow><msup><mi>a</mi><mn>2</mn></msup><mspace width="1em" /></mrow></math>"#;
        let node = parse_mathml(ml).unwrap();
        assert_eq!(node.tag(), Some("math"));
        let MathNode::Element {
            attrs, children, ..
        } = &node
        else {
            panic!()
        };
        assert_eq!(attrs, &vec![("display".to_string(), "block".to_string())]);
        assert_eq!(children.len(), 1);
        assert_eq!(children[0].tag(), Some("mrow"));
    }

    #[test]
    fn unescapes_entities() {
        let ml = r#"<mo>&lt;</mo>"#;
        let node = parse_mathml(ml).unwrap();
        assert_eq!(node.text_content(), "<");
    }

    #[test]
    fn parses_annotation_with_special_chars() {
        let ml = r#"<math><semantics><mrow><mi>x</mi></mrow><annotation encoding="application/x-tex">a &amp; b</annotation></semantics></math>"#;
        let node = parse_mathml(ml).unwrap();
        assert!(node.text_content().contains("a & b"));
    }

    #[test]
    fn roundtrips_real_pulldown_output() {
        let ml = crate::latex_to_mathml("x^2", crate::MathDisplay::Inline).unwrap();
        let node = parse_mathml(&ml).unwrap();
        assert_eq!(node.tag(), Some("math"));
    }

    #[test]
    fn tolerates_unescaped_lt_operator() {
        // `pulldown-latex` emits `<mo><</mo>` for the `<` operator (invalid XML).
        let ml = r#"<mrow><mi>x</mi><mo><</mo><mn>0</mn></mrow>"#;
        let node = parse_mathml(ml).unwrap();
        assert!(node.text_content().contains('<'));
        let MathNode::Element { children, .. } = &node else {
            panic!()
        };
        // x, <mo><</mo>, 0
        assert_eq!(children.len(), 3);
        assert_eq!(children[1].text_content(), "<");
    }

    #[test]
    fn maps_nbsp_entity() {
        let node = parse_mathml(r#"<mtext>&nbsp;if&nbsp;</mtext>"#).unwrap();
        assert_eq!(node.text_content(), "\u{00A0}if\u{00A0}");
    }
}
