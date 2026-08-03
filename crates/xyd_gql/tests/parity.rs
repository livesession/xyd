//! Tier-1 fixture parity: the Rust converter must structurally reproduce every
//! committed oracle in packages/xyd-gql/__fixtures__ (the JS implementation's
//! frozen output). The case list + options mirror the vitest matrix in
//! packages/xyd-gql/__tests__/gqlSchemaToReferences.test.ts exactly.

use std::fs;

use xyd_gql::{gql_schema_to_references, Options};

fn run_case(name: &str, options: Option<Options>) {
    let fixtures = xyd_parity::fixtures_dir(env!("CARGO_MANIFEST_DIR"), "xyd-gql");
    let case = fixtures.join(name);
    let sdl = fs::read_to_string(case.join("input.graphql"))
        .unwrap_or_else(|e| panic!("{name}: read input.graphql: {e}"));

    let refs = gql_schema_to_references(&[sdl], options)
        .unwrap_or_else(|e| panic!("{name}: convert failed: {e}"));
    let actual = serde_json::to_value(&refs).expect("serialize");

    xyd_parity::assert_parity(&case, &actual);
}

macro_rules! parity_case {
    ($test:ident, $name:literal) => {
        #[test]
        fn $test() {
            run_case($name, None);
        }
    };
    ($test:ident, $name:literal, flat) => {
        #[test]
        fn $test() {
            run_case(
                $name,
                Some(Options {
                    flat: Some(true),
                    ..Default::default()
                }),
            );
        }
    };
}

parity_case!(basic, "1.basic");
parity_case!(circular, "2.circular");
parity_case!(opendocs, "3.opendocs");
parity_case!(union_case, "4.union");
parity_case!(flat_case, "5.flat", flat);
parity_case!(default_values, "6.default-values");
parity_case!(type_args, "7.type-args");
parity_case!(default_sort, "8.default-sort");
parity_case!(opendocs_flat, "-1.opendocs.flat");
parity_case!(opendocs_sort, "-1.opendocs.sort");
parity_case!(opendocs_sort_group, "-1.opendocs.sort+group");
parity_case!(opendocs_sort_group_path, "-1.opendocs.sort+group+path");
parity_case!(opendocs_scopes, "-1.opendocs.scopes");
parity_case!(opendocs_docs_nested, "-1.opendocs.docs-nested");
