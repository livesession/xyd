//! The recording server and request diff — the shared half of the real-SDK e2e.
//!
//! A generated SDK is pointed at a local HTTP server, told to call one method, and
//! the request it ACTUALLY made is compared against the committed
//! `<op>/recorded.json`. This is the tier that proves the SDK talks to the right
//! endpoint with the right shape — something neither the byte goldens nor the
//! offline binding guard can show, because both only inspect what the emitter
//! WROTE, never what the compiled client DOES.
//!
//! Ported from the deleted `@xyd-js/opensdk-ci`; recover the original with
//! `git show 4c9ae3b1^:packages/xyd-opensdk-ci/src/e2e.ts`.

use std::sync::{Arc, Mutex};

use xyd_opensdk_cli_common::RecordedRequest;

/// One captured HTTP request, before normalization.
#[derive(Debug, Clone, Default)]
pub struct RawRequest {
    pub method: String,
    pub url: String,
    pub content_type: String,
    pub authorization: String,
    pub body: String,
}

/// A local server that records the LAST request it received and answers `{"ok":true}`.
///
/// Bound to 127.0.0.1:0 so parallel test binaries never contend for a port.
pub struct RecordingServer {
    pub port: u16,
    last: Arc<Mutex<Option<RawRequest>>>,
    shutdown: Arc<tiny_http::Server>,
    handle: Option<std::thread::JoinHandle<()>>,
}

impl RecordingServer {
    pub fn start() -> Result<Self, String> {
        let server =
            Arc::new(tiny_http::Server::http("127.0.0.1:0").map_err(|e| format!("bind: {e}"))?);
        let port = server.server_addr().to_ip().ok_or("no ip addr")?.port();
        let last: Arc<Mutex<Option<RawRequest>>> = Arc::new(Mutex::new(None));

        let srv = Arc::clone(&server);
        let slot = Arc::clone(&last);
        let handle = std::thread::spawn(move || {
            for mut req in srv.incoming_requests() {
                let mut body = String::new();
                // Bodies may carry binary multipart payloads; read lossily rather
                // than failing — the part HEADERS we care about are ASCII.
                let mut buf = Vec::new();
                let _ = req.as_reader().read_to_end(&mut buf);
                body.push_str(&String::from_utf8_lossy(&buf));

                // Snapshot the headers to owned pairs first: a closure borrowing
                // `req` here would outlive the borrow when `req` is moved into
                // `respond` below.
                let headers: Vec<(String, String)> = req
                    .headers()
                    .iter()
                    .map(|h| {
                        (
                            h.field.as_str().as_str().to_ascii_lowercase(),
                            h.value.as_str().to_string(),
                        )
                    })
                    .collect();
                let header = |name: &str| {
                    headers
                        .iter()
                        .find(|(k, _)| k == name)
                        .map(|(_, v)| v.clone())
                        .unwrap_or_default()
                };
                let raw = RawRequest {
                    method: req.method().as_str().to_string(),
                    url: req.url().to_string(),
                    content_type: header("content-type"),
                    authorization: header("authorization"),
                    body,
                };
                *slot.lock().unwrap() = Some(raw);
                let _ = req.respond(
                    tiny_http::Response::from_string("{\"ok\":true}").with_header(
                        tiny_http::Header::from_bytes(
                            &b"content-type"[..],
                            &b"application/json"[..],
                        )
                        .unwrap(),
                    ),
                );
            }
        });

        Ok(Self {
            port,
            last,
            shutdown: server,
            handle: Some(handle),
        })
    }

    pub fn base_url(&self) -> String {
        format!("http://127.0.0.1:{}", self.port)
    }

    /// Clear the slot before driving the SDK, so a stale capture can't be mistaken
    /// for a fresh one.
    pub fn reset(&self) {
        *self.last.lock().unwrap() = None;
    }

    pub fn take(&self) -> Option<RawRequest> {
        self.last.lock().unwrap().clone()
    }
}

impl Drop for RecordingServer {
    fn drop(&mut self) {
        self.shutdown.unblock();
        if let Some(h) = self.handle.take() {
            let _ = h.join();
        }
    }
}

/// Field names carried by a request body, by content type.
pub fn body_field_names(body: &str, content_type: &str) -> Vec<String> {
    let ct = content_type.to_ascii_lowercase();
    let mut names: Vec<String> = if ct.contains("multipart/form-data") {
        multipart_part_names(body)
    } else if ct.contains("x-www-form-urlencoded") {
        body.split('&')
            .filter(|p| !p.is_empty())
            .map(|p| percent_decode(p.split('=').next().unwrap_or("")))
            .collect()
    } else {
        match serde_json::from_str::<serde_json::Value>(body) {
            Ok(serde_json::Value::Object(m)) => m.keys().cloned().collect(),
            _ => Vec::new(),
        }
    };
    names.sort();
    names.dedup();
    names
}

/// Lift `name=` from multipart part headers.
///
/// Hand-rolled rather than pulling in `regex` for a test-only crate. Two details
/// the TypeScript called out and that a naive scan gets wrong:
///   * both quoted (`name="x"`, Go/Java/Python) and unquoted (`name=x`, .NET's
///     MultipartFormDataContent default) forms are legal per RFC 7578;
///   * `filename=` must NOT match — hence the word-boundary check on the char
///     preceding `name=`, so a file part is counted by its real name.
fn multipart_part_names(body: &str) -> Vec<String> {
    let mut out = Vec::new();
    for line in body.lines() {
        let lower = line.to_ascii_lowercase();
        if !lower.contains("content-disposition:") || !lower.contains("form-data") {
            continue;
        }
        let bytes = line.as_bytes();
        let mut i = 0;
        while let Some(rel) = line[i..].find("name=") {
            let at = i + rel;
            // word boundary: reject `filename=` / `name*=` by checking the char before
            let boundary =
                at == 0 || !bytes[at - 1].is_ascii_alphanumeric() && bytes[at - 1] != b'*';
            i = at + 5;
            if !boundary {
                continue;
            }
            let rest = &line[i..];
            let value = if let Some(stripped) = rest.strip_prefix('"') {
                stripped.find('"').map(|e| stripped[..e].to_string())
            } else {
                Some(
                    rest.split(|c: char| c == ';' || c.is_whitespace())
                        .next()
                        .unwrap_or("")
                        .to_string(),
                )
            };
            if let Some(v) = value {
                if !v.is_empty() {
                    out.push(v);
                }
            }
        }
    }
    out
}

fn percent_decode(s: &str) -> String {
    let b = s.as_bytes();
    let mut out = Vec::with_capacity(b.len());
    let mut i = 0;
    while i < b.len() {
        match b[i] {
            b'+' => {
                out.push(b' ');
                i += 1;
            }
            b'%' if i + 2 < b.len() => match u8::from_str_radix(&s[i + 1..i + 3], 16) {
                Ok(v) => {
                    out.push(v);
                    i += 3;
                }
                Err(_) => {
                    out.push(b[i]);
                    i += 1;
                }
            },
            c => {
                out.push(c);
                i += 1;
            }
        }
    }
    String::from_utf8_lossy(&out).to_string()
}

/// Normalize a capture into the same shape as a committed `recorded.json` request.
pub fn normalize_recorded(raw: &RawRequest) -> RecordedRequest {
    let (path, qs) = match raw.url.split_once('?') {
        Some((p, q)) => (p.to_string(), q.to_string()),
        None => (raw.url.clone(), String::new()),
    };
    let mut query: Vec<String> = if qs.is_empty() {
        Vec::new()
    } else {
        qs.split('&')
            .filter(|p| !p.is_empty())
            .map(|p| percent_decode(p.split('=').next().unwrap_or("")))
            .collect()
    };
    query.sort();
    query.dedup();

    let auth = if raw.authorization.starts_with("Bearer ") {
        "bearer"
    } else if !raw.authorization.is_empty() {
        "apikey"
    } else {
        ""
    };

    RecordedRequest {
        method: raw.method.to_ascii_lowercase(),
        path,
        query,
        body_fields: body_field_names(&raw.body, &raw.content_type),
        auth: auth.to_string(),
        content_type: raw
            .content_type
            .split(';')
            .next()
            .filter(|s| !s.is_empty())
            .map(str::to_string),
    }
}

/// Compare an observed request against a committed fixture. Empty = match.
///
/// `path` is matched as a PATTERN: the fixture keeps its `{param}` placeholders,
/// which stand in for any single segment. `bodyFields` is a SUBSET check — the SDK
/// may legitimately send more than the required fields the fixture records.
pub fn diff_request(actual: &RecordedRequest, fixture: &RecordedRequest) -> Vec<String> {
    let mut errs = Vec::new();
    if actual.method != fixture.method {
        errs.push(format!("method {} != {}", actual.method, fixture.method));
    }
    if !path_matches(&actual.path, &fixture.path) {
        errs.push(format!("path {} !~ {}", actual.path, fixture.path));
    }
    if actual.query.join(",") != fixture.query.join(",") {
        errs.push(format!(
            "query [{}] != [{}]",
            actual.query.join(","),
            fixture.query.join(",")
        ));
    }
    for f in &fixture.body_fields {
        if !actual.body_fields.contains(f) {
            errs.push(format!("body missing {f}"));
        }
    }
    if actual.auth != fixture.auth {
        errs.push(format!("auth {} != {}", actual.auth, fixture.auth));
    }
    errs
}

/// `/pets/{id}` matches `/pets/abc` but not `/pets/abc/toys` — `{...}` stands for
/// exactly one segment. Segment-wise rather than regex, to avoid a dependency.
fn path_matches(actual: &str, pattern: &str) -> bool {
    let a: Vec<&str> = actual.split('/').collect();
    let p: Vec<&str> = pattern.split('/').collect();
    if a.len() != p.len() {
        return false;
    }
    a.iter().zip(p.iter()).all(|(av, pv)| {
        if pv.starts_with('{') && pv.ends_with('}') {
            !av.is_empty()
        } else {
            av == pv
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn path_placeholders_match_one_segment_only() {
        assert!(path_matches("/pets/abc", "/pets/{id}"));
        assert!(path_matches(
            "/evals/e1/runs/r1",
            "/evals/{eval_id}/runs/{run_id}"
        ));
        // must NOT swallow extra segments — that would let a wrong endpoint pass
        assert!(!path_matches("/pets/abc/toys", "/pets/{id}"));
        assert!(!path_matches("/pets", "/pets/{id}"));
        assert!(!path_matches("/dogs/abc", "/pets/{id}"));
    }

    #[test]
    fn multipart_names_quoted_and_unquoted_but_never_filename() {
        let body = "--b\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.png\"\r\n\r\nBIN\r\n\
                    --b\r\nContent-Disposition: form-data; name=purpose\r\n\r\nfine-tune\r\n--b--";
        let got = body_field_names(body, "multipart/form-data; boundary=b");
        assert_eq!(
            got,
            vec!["file", "purpose"],
            "filename must not be lifted as a part name"
        );
    }

    #[test]
    fn json_urlencoded_and_empty_bodies() {
        assert_eq!(
            body_field_names(r#"{"b":1,"a":2}"#, "application/json"),
            vec!["a", "b"]
        );
        assert_eq!(
            body_field_names("z=1&a=2", "application/x-www-form-urlencoded"),
            vec!["a", "z"]
        );
        assert!(body_field_names("", "application/json").is_empty());
        assert!(body_field_names("not json", "application/json").is_empty());
    }

    #[test]
    fn auth_scheme_is_classified_like_the_typescript() {
        let bearer = RawRequest {
            authorization: "Bearer sk-x".into(),
            ..Default::default()
        };
        assert_eq!(normalize_recorded(&bearer).auth, "bearer");
        let key = RawRequest {
            authorization: "sk-x".into(),
            ..Default::default()
        };
        assert_eq!(normalize_recorded(&key).auth, "apikey");
        assert_eq!(normalize_recorded(&RawRequest::default()).auth, "");
    }

    #[test]
    fn body_fields_are_a_subset_check_not_equality() {
        let fixture = RecordedRequest {
            method: "post".into(),
            path: "/pets".into(),
            query: vec![],
            body_fields: vec!["name".into()],
            auth: "bearer".into(),
            content_type: None,
        };
        // An SDK sending MORE than the required fields is fine.
        let actual = RecordedRequest {
            body_fields: vec!["name".into(), "tag".into()],
            ..fixture.clone()
        };
        assert!(diff_request(&actual, &fixture).is_empty());
        // Missing a required field is not.
        let missing = RecordedRequest {
            body_fields: vec!["tag".into()],
            ..fixture.clone()
        };
        assert_eq!(diff_request(&missing, &fixture), vec!["body missing name"]);
    }

    #[test]
    fn server_records_the_last_request() {
        let srv = RecordingServer::start().expect("start");
        // Drive it with a raw socket write — no HTTP client dependency needed.
        // `Connection: close` is load-bearing: without it HTTP/1.1 keep-alive means
        // the server never closes the socket and a read-to-EOF hangs forever.
        use std::io::Write;
        let mut s = std::net::TcpStream::connect(("127.0.0.1", srv.port)).unwrap();
        s.set_read_timeout(Some(std::time::Duration::from_secs(5)))
            .unwrap();
        let body = r#"{"name":"rex"}"#;
        write!(
            s,
            "POST /pets?b=2&a=1 HTTP/1.1\r\nHost: x\r\nConnection: close\r\nAuthorization: Bearer k\r\ncontent-type: application/json\r\nContent-Length: {}\r\n\r\n{}",
            body.len(), body
        )
        .unwrap();
        let _ = s.flush();
        let mut resp = String::new();
        let _ = std::io::Read::read_to_string(&mut s, &mut resp);

        let raw = srv.take().expect("a request was recorded");
        let norm = normalize_recorded(&raw);
        assert_eq!(norm.method, "post");
        assert_eq!(norm.path, "/pets");
        assert_eq!(norm.query, vec!["a", "b"]);
        assert_eq!(norm.body_fields, vec!["name"]);
        assert_eq!(norm.auth, "bearer");
        assert_eq!(norm.content_type.as_deref(), Some("application/json"));
    }
}
