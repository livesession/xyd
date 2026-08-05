//! Runtime emission — port of runtime.ts. `runtime.go` is the fixed generic
//! HTTP runtime (vendored verbatim as an asset, exactly as the JS hardcodes
//! it); `config.go` is templated from the spec's root x-openapi security.

use serde_json::Value;

use crate::naming::screaming_snake_case;

/// Static, generic HTTP runtime copied verbatim into every generated project.
pub fn runtime_go() -> String {
    include_str!("runtime.go.txt").to_string()
}

fn q(s: &str) -> String {
    serde_json::to_string(s).expect("string serializes")
}

/// The auth block for one security scheme (None → unsupported kind, skipped).
fn auth_block(scheme: &Value) -> Option<String> {
    let env = scheme
        .get("envVar")
        .and_then(|v| v.as_str())
        .unwrap_or("API_KEY");
    let name = scheme.get("name").and_then(|v| v.as_str()).unwrap_or("");
    let kind = scheme.get("kind").and_then(|v| v.as_str()).unwrap_or("");
    match kind {
        "bearer" => Some(format!(
            "\tif v := os.Getenv({}); v != \"\" {{\n\t\treq.Header.Set(\"Authorization\", \"Bearer \"+v)\n\t}}",
            q(env)
        )),
        "apiKey-header" => Some(format!(
            "\tif v := os.Getenv({}); v != \"\" {{\n\t\treq.Header.Set({}, v)\n\t}}",
            q(env),
            q(name)
        )),
        "apiKey-query" => Some(format!(
            "\tif v := os.Getenv({}); v != \"\" {{\n\t\tq := req.URL.Query()\n\t\tq.Set({}, v)\n\t\treq.URL.RawQuery = q.Encode()\n\t}}",
            q(env),
            q(name)
        )),
        "apiKey-cookie" => Some(format!(
            "\tif v := os.Getenv({}); v != \"\" {{\n\t\treq.AddCookie(&http.Cookie{{Name: {}, Value: v}})\n\t}}",
            q(env),
            q(name)
        )),
        "basic" => Some(format!(
            "\tuser := os.Getenv({})\n\tpass := os.Getenv({})\n\tif user != \"\" || pass != \"\" {{\n\t\treq.SetBasicAuth(user, pass)\n\t}}",
            q(&format!("{env}_USERNAME")),
            q(&format!("{env}_PASSWORD"))
        )),
        _ => None,
    }
}

/// Generated config: base URL + auth, from the spec's root x-openapi.
pub fn config_go(spec: &Value, bin_name: &str, base_url: &str) -> String {
    let prefix = screaming_snake_case(bin_name);
    let security = spec
        .get("x-openapi")
        .and_then(|x| x.get("security"))
        .and_then(|s| s.as_array())
        .cloned()
        .unwrap_or_default();
    let blocks: Vec<String> = security.iter().filter_map(auth_block).collect();
    let auth_body = if blocks.is_empty() {
        String::new()
    } else {
        format!("\n{}\n", blocks.join("\n"))
    };

    format!(
        "package runtime\n\nimport (\n\t\"net/http\"\n\t\"os\"\n)\n\nconst defaultBaseURL = {}\n\n// BaseURL returns the API base URL, overridable via {prefix}_BASE_URL.\nfunc BaseURL() string {{\n\tif v := os.Getenv({}); v != \"\" {{\n\t\treturn v\n\t}}\n\treturn defaultBaseURL\n}}\n\n// applyAuth attaches credentials read from the environment to the request.\nfunc applyAuth(req *http.Request) {{{auth_body}}}\n",
        q(base_url),
        q(&format!("{prefix}_BASE_URL"))
    )
}
