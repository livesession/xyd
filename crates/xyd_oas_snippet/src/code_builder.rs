//! Port of httpsnippet's `CodeBuilder` (line aggregation with an indentation
//! character and a configurable join). The clients xyd uses never register
//! post-processors, so those are omitted.

pub struct CodeBuilder {
    indent_char: String,
    line_join: String,
    code: Vec<String>,
}

impl CodeBuilder {
    pub fn new(indent: &str, join: Option<&str>) -> Self {
        CodeBuilder {
            indent_char: indent.to_string(),
            line_join: join.unwrap_or("\n").to_string(),
            code: Vec::new(),
        }
    }

    fn indent_line(&self, line: &str, level: usize) -> String {
        format!("{}{line}", self.indent_char.repeat(level))
    }

    pub fn push(&mut self, line: &str, level: usize) {
        let l = self.indent_line(line, level);
        self.code.push(l);
    }

    pub fn push0(&mut self, line: &str) {
        self.push(line, 0);
    }

    pub fn blank(&mut self) {
        self.code.push(String::new());
    }

    pub fn join(&self) -> String {
        self.code.join(&self.line_join)
    }
}
