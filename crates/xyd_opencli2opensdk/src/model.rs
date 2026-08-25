//! The CLI-mode OpenSDK IR — this crate's own copy of the OpenSDK model
//! (per-crate model copies are the workspace convention; the HTTP-mode source
//! of truth is xyd_openapi2opensdk/src/model.rs). Deviations from the HTTP
//! model, per the x-cli contract:
//!
//! - `Spec` carries a root `x-cli` block (the CLI-mode discriminator emitters
//!   branch on) and a NEW spec-level `methods` array for root client methods
//!   (`xyd.build()`, `xyd.optVersion()`).
//! - `Method` has NO `httpMethod`/`path`; its argv binding lives in `x-cli`.
//!   `pathParams` carry the ordered positional CLI arguments and `queryParams`
//!   the flag-bound options, so emitters reuse their existing signature and
//!   params-builder machinery unchanged.
//! - HTTP-only types (Security, RequestBody, Pagination, Discriminator) are
//!   dropped.

use serde::Serialize;
use serde_json::{Map, Value};

#[derive(Serialize, Clone)]
pub struct Spec {
    pub opensdk: String,
    pub info: Info,
    #[serde(rename = "x-cli")]
    pub x_cli: XCliRoot,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub types: Option<Vec<NamedType>>,
    /// Root-level client methods (root commands and opt-methods).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub methods: Option<Vec<Method>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resources: Option<Vec<Resource>>,
    /// Always stamped: the merged CLI runtime-behavior contract.
    pub sdk: Value,
}

#[derive(Serialize, Clone)]
pub struct Info {
    pub title: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contact: Option<Map<String, Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub license: Option<Map<String, Value>>,
}

/// Root-level `x-cli`: how generated SDKs locate and invoke the binary.
#[derive(Serialize, Clone)]
pub struct XCliRoot {
    /// Binary name invoked (resolved via PATH unless overridden).
    pub bin: String,
    /// Environment variable checked first for an absolute binary path.
    #[serde(rename = "envVar")]
    pub env_var: String,
    /// Source OpenCLI spec version (provenance).
    pub opencli: String,
    /// Passthrough of the OpenCLI root `conventions` object when present.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conventions: Option<Value>,
}

/// Per-method `x-cli`: the argv binding — the mirror of the OpenCLI pipeline's
/// `x-openapi` request binding, and the single source of truth for how a
/// generated SDK method assembles its command line.
#[derive(Serialize, Clone)]
pub struct XCliMethod {
    /// Literal subcommand tokens after the binary (may be empty for root and
    /// opt-methods). Always canonical command names, never aliases.
    pub command: Vec<String>,
    /// Positional bindings; array order = argv order = `pathParams` order.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub args: Option<Vec<XCliArg>>,
    /// Named-flag bindings, one per bound `queryParams` entry (plus constant
    /// flags, which have no `from`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<Vec<XCliOpt>>,
    /// Passthrough of the OpenCLI `interactive` flag (command needs a TTY).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interactive: Option<bool>,
    /// Passthrough of the command's `exitCodes` list.
    #[serde(rename = "exitCodes", skip_serializing_if = "Option::is_none")]
    pub exit_codes: Option<Value>,
}

#[derive(Serialize, Clone)]
pub struct XCliArg {
    /// `param:<name>` — resolves against `pathParams` by param name.
    pub from: String,
    /// string | number | integer | boolean | json
    pub encoding: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
    /// Array-typed param whose items spread as consecutive argv tokens.
    /// Only valid on the last entry.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variadic: Option<bool>,
}

#[derive(Serialize, Clone)]
pub struct XCliOpt {
    /// The literal argv token including dashes (`--model`, `-x`) — the
    /// converter decides rendering once; emitters just append the token.
    pub flag: String,
    /// `param:<name>` — resolves against `queryParams` by param name.
    /// ABSENT for constant flags, which are always appended (how
    /// `optVersion()` binds `--version`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    /// string | number | integer | boolean | json (element encoding when
    /// `repeat`). Absent for constant flags.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub encoding: Option<String>,
    /// Array-typed param: repeat the flag per item (`--tag a --tag b`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repeat: Option<bool>,
}

#[derive(Serialize, Clone)]
pub struct TypeRef {
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scalar: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<String>,
    #[serde(rename = "const", skip_serializing_if = "Option::is_none")]
    pub konst: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub items: Option<Box<TypeRef>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub values: Option<Box<TypeRef>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nullable: Option<bool>,
}

impl TypeRef {
    pub fn of_kind(kind: &str) -> Self {
        TypeRef {
            kind: kind.to_string(),
            name: None,
            scalar: None,
            format: None,
            konst: None,
            items: None,
            values: None,
            nullable: None,
        }
    }

    pub fn any() -> Self {
        Self::of_kind("any")
    }

    pub fn scalar(scalar: &str) -> Self {
        let mut r = Self::of_kind("scalar");
        r.scalar = Some(scalar.to_string());
        r
    }

    pub fn array(items: TypeRef) -> Self {
        let mut r = Self::of_kind("array");
        r.items = Some(Box::new(items));
        r
    }

    pub fn reference(name: String) -> Self {
        let mut r = Self::of_kind("ref");
        r.name = Some(name);
        r
    }
}

#[derive(Serialize, Clone)]
pub struct EnumValue {
    pub value: Value,
}

#[derive(Serialize, Clone)]
pub struct Field {
    pub name: String,
    #[serde(rename = "type")]
    pub field_type: TypeRef,
    pub required: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

/// One named type in the symbol table. `kind` discriminates struct | enum;
/// the body fields are kind-specific.
#[derive(Serialize, Clone)]
pub struct NamedType {
    pub name: String,
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub values: Option<Vec<EnumValue>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fields: Option<Vec<Field>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct Param {
    pub name: String,
    #[serde(rename = "type")]
    pub param_type: TypeRef,
    pub required: bool,
    #[serde(rename = "wireName", skip_serializing_if = "Option::is_none")]
    pub wire_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub example: Option<Value>,
}

#[derive(Serialize, Clone)]
pub struct Response {
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct Method {
    pub action: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Ordered positional CLI arguments.
    #[serde(rename = "pathParams", skip_serializing_if = "Option::is_none")]
    pub path_params: Option<Vec<Param>>,
    /// Flag-bound CLI options.
    #[serde(rename = "queryParams", skip_serializing_if = "Option::is_none")]
    pub query_params: Option<Vec<Param>>,
    /// Mapped from the command's `exitCodes`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub responses: Option<Vec<Response>>,
    /// Always `{"kind":"ref","name":"CommandResult"}` in v1.
    #[serde(rename = "primaryResponse")]
    pub primary_response: TypeRef,
    #[serde(rename = "x-cli")]
    pub x_cli: XCliMethod,
}

#[derive(Serialize, Clone)]
pub struct Resource {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub methods: Option<Vec<Method>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resources: Option<Vec<Resource>>,
}
