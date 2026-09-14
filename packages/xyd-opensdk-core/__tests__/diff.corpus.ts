// Corpus construction for the `diffIR` golden oracle.
//
// Every spec here is either a REAL committed IR fixture (from
// `packages/xyd-opensdk-go/__fixtures__`) or a deep-clone of one with an
// explicit, hand-written mutation applied. Nothing is hand-authored from
// scratch, so the corpus exercises `diffIR` on shapes the converter actually
// produces.
//
// `diff.golden.test.ts` materializes these into `__fixtures__/diff/_specs/*.json`
// (under `O2S_BUILD_DOCS=1`) and then only ever READS them back — the committed
// JSON is the input side of the oracle, this file is just how it was minted.
import fs from 'node:fs';
import path from 'node:path';

// Specs are manipulated structurally (and deliberately malformed in places the
// IR schema forbids), so they are untyped here on purpose.
// biome-ignore lint/suspicious/noExplicitAny: fixtures poke at shapes the types disallow
type Spec = any;

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/**
 * A number literal that must reach the fixture file VERBATIM.
 *
 * `JSON.stringify` normalizes JS numbers (1.0 -> `1`, -0 -> `0`), so there is
 * no way to author `1.0` in a generated fixture through the normal path — yet
 * "a spec written with `1.0` vs one written with `1`" is exactly the case that
 * catches a port using native float formatting. `RAW('1.0')` serializes as the
 * string `"@@raw:1.0@@"`, which `writeRawNumbers` unquotes on the way out.
 */
export const RAW = (literal: string) => `@@raw:${literal}@@`;

/**
 * A raw JSON fragment that must reach the fixture file VERBATIM, escaping JS's
 * own normalization of the object it describes.
 *
 * Needed for one thing in particular: a JS object literal REORDERS array-index
 * keys (`{"429":…,"400":…}` becomes `{"400":…,"429":…}` the moment it is
 * created), so an out-of-order `statusCodeMap` cannot be authored in JS at all
 * — yet a Rust-produced IR has no such reordering, and `diffIR` compares these
 * maps via `JSON.stringify`. Base64 keeps the fragment opaque to the writer's
 * own string escaping.
 */
export const RAWJSON = (json: string) =>
  `@@json:${Buffer.from(json, 'utf-8').toString('base64')}@@`;

/** Unquote every `RAW(...)` / `RAWJSON(...)` sentinel in a serialized fixture. */
export function writeRawNumbers(json: string): string {
  return json
    .replace(/"@@raw:([-+0-9.eE]+)@@"/g, '$1')
    .replace(/"@@json:([A-Za-z0-9+/=]+)@@"/g, (_m, b64) =>
      Buffer.from(b64, 'base64').toString('utf-8'),
    );
}

/* ------------------------------------------------------------------ real IRs */

function readGoFixture(goFixtures: string, name: string): Spec {
  return JSON.parse(fs.readFileSync(path.join(goFixtures, name, 'input.json'), 'utf-8'));
}

/**
 * The OpenAI per-operation IRs merged into one spec (types deduped by name,
 * resource trees mounted into a single tree). This is the "realistic large"
 * corpus entry: 25 operations, ~200 named types across all four type kinds.
 * The op list is pinned so the merge is reproducible.
 */
const OPENAI_OPS = [
  'admin__organization__admin-api-keys__create',
  'admin__organization__certificates__update',
  'admin__organization__groups__users__list',
  'admin__organization__projects__certificates__list',
  'admin__organization__projects__service-accounts__list',
  'admin__organization__roles__update',
  'admin__organization__users__retrieve',
  'audio__translations__create',
  'audio__voice-consents__retrieve',
  'beta__assistants__update',
  'beta__threads__messages__list',
  'beta__threads__runs__steps__retrieve',
  'beta__threads__runs__submit-tool-outputs__create',
  'containers__delete',
  'conversations__items__delete',
  'conversations__update',
  'files__list',
  'files__retrieve',
  'fine-tuning__jobs__pause',
  'models__list',
  'projects__groups__roles__delete',
  'realtime__calls__hangup',
  'skills__versions__delete',
  'vector-stores__file-batches__list-files',
  'vector-stores__update',
];

function mergeOpenaiOps(goFixtures: string, ops: string[]): Spec {
  const dir = path.join(goFixtures, '-2.complex.openai');
  const merged: Spec = { types: [], resources: [] };
  const seenTypes = new Set<string>();
  let first = true;

  const mount = (root: Spec[], segs: string[], methods: Spec[]) => {
    let list = root;
    let node: Spec | null = null;
    for (const seg of segs) {
      let found = list.find((r: Spec) => r.name === seg);
      if (!found) {
        found = { name: seg };
        list.push(found);
      }
      node = found;
      if (!node.resources) node.resources = [];
      list = node.resources;
    }
    if (!node) return;
    if (!node.methods) node.methods = [];
    node.methods.push(...methods);
  };
  const flatten = (resources: Spec[] | undefined, parent: string[], out: [string[], Spec[]][]) => {
    for (const r of resources || []) {
      const segs = [...parent, r.name];
      if (r.methods?.length) out.push([segs, r.methods]);
      if (r.resources) flatten(r.resources, segs, out);
    }
  };

  for (const op of ops) {
    const spec = JSON.parse(fs.readFileSync(path.join(dir, op, 'input.json'), 'utf-8'));
    if (first) {
      merged.opensdk = spec.opensdk;
      merged.info = spec.info;
      merged.servers = spec.servers;
      merged.security = spec.security;
      first = false;
    }
    for (const t of spec.types || []) {
      if (seenTypes.has(t.name)) continue;
      seenTypes.add(t.name);
      merged.types.push(t);
    }
    const flat: [string[], Spec[]][] = [];
    flatten(spec.resources, [], flat);
    for (const [segs, methods] of flat) mount(merged.resources, segs, methods);
  }

  const prune = (resources: Spec[] | undefined) => {
    for (const r of resources || []) {
      if (r.resources && !r.resources.length) delete r.resources;
      else prune(r.resources);
    }
  };
  prune(merged.resources);
  return merged;
}

/* -------------------------------------------------------------- mutators */

const methodsOf = (s: Spec) => s.resources[0].methods as Spec[];
const method = (s: Spec, action: string) => methodsOf(s).find((m) => m.action === action) as Spec;
const namedType = (s: Spec, name: string) => (s.types as Spec[]).find((t) => t.name === name) as Spec;

/** Apply `fn` to a deep clone and return it. */
const mut = (s: Spec, fn: (s: Spec) => void): Spec => {
  const copy = clone(s);
  fn(copy);
  return copy;
};

/**
 * Build every spec in the corpus. Keys become `_specs/<key>.json`.
 */
export function buildSpecs(goFixtures: string): Record<string, Spec> {
  const basic = readGoFixture(goFixtures, '1.basic');
  const wire = readGoFixture(goFixtures, '2.wire');
  const unions = readGoFixture(goFixtures, '3.unions');
  const xOpenSdk = readGoFixture(goFixtures, '9.x-open-sdk');
  const sdkBehavior = readGoFixture(goFixtures, '10.sdk-behavior');
  const sdkBehaviorPg = readGoFixture(goFixtures, '11.sdk-behavior-pagination');

  const openaiDir = path.join(goFixtures, '-2.complex.openai');
  const openaiConvUpdate = JSON.parse(
    fs.readFileSync(path.join(openaiDir, 'conversations__update', 'input.json'), 'utf-8'),
  );
  const openaiConvItemsDelete = JSON.parse(
    fs.readFileSync(path.join(openaiDir, 'conversations__items__delete', 'input.json'), 'utf-8'),
  );
  const openaiMixed = mergeOpenaiOps(goFixtures, OPENAI_OPS);
  const openaiSubset = mergeOpenaiOps(goFixtures, OPENAI_OPS.slice(0, 8));

  const specs: Record<string, Spec> = {
    basic,
    wire,
    unions,
    'x-open-sdk': xOpenSdk,
    'sdk-behavior': sdkBehavior,
    'sdk-behavior-pagination': sdkBehaviorPg,
    'openai-conversations-update': openaiConvUpdate,
    'openai-conversations-items-delete': openaiConvItemsDelete,
    'openai-mixed': openaiMixed,
    'openai-mixed-subset': openaiSubset,
  };

  /* ---- method shape: removed / added / binding / deprecated / security --- */
  specs['basic.methods'] = mut(basic, (s) => {
    const ms = methodsOf(s);
    // method-removed: drop `download_photo`
    s.resources[0].methods = ms.filter((m) => m.action !== 'download_photo');
    // method-added
    s.resources[0].methods.push({
      action: 'archive',
      httpMethod: 'post',
      path: '/pets/{pet_id}/archive',
      pathParams: [{ name: 'pet_id', type: { kind: 'scalar', scalar: 'string' }, required: true }],
    });
    // binding-changed (path)
    method(s, 'retrieve').path = '/v2/pets/{pet_id}';
    // binding-changed (httpMethod)
    method(s, 'create').httpMethod = 'put';
    // deprecated-added on a method
    method(s, 'list').deprecated = true;
    // per-operation security-changed
    method(s, 'create').security = [{ type: 'apiKey', kind: 'apiKey-header', name: 'X-Key' }];
  });

  /* ---- query params ------------------------------------------------------ */
  specs['basic.query-params'] = mut(basic, (s) => {
    const list = method(s, 'list');
    list.queryParams = [
      // `after` dropped -> param-removed
      // `limit` keeps its name: type change + required flip + wireName + deprecated
      {
        name: 'limit',
        wireName: 'limit[]',
        type: { kind: 'scalar', scalar: 'string' },
        required: true,
        deprecated: true,
      },
      // param-added (required -> breaking)
      { name: 'order', type: { kind: 'scalar', scalar: 'string' }, required: true },
      // param-added (optional -> safe)
      { name: 'sort', type: { kind: 'scalar', scalar: 'string' }, required: false },
      // param-added with no `required` key at all (falsy -> safe)
      { name: 'cursor', type: { kind: 'scalar', scalar: 'string' } },
    ];
  });

  /* ---- path + header params (the other two diffParams groups) ------------ */
  specs['basic.path-header-params.base'] = mut(basic, (s) => {
    method(s, 'retrieve').headerParams = [
      { name: 'x_trace', type: { kind: 'scalar', scalar: 'string' }, required: false },
      { name: 'x_drop_me', type: { kind: 'scalar', scalar: 'string' }, required: true },
    ];
  });
  specs['basic.path-header-params.head'] = mut(basic, (s) => {
    const retrieve = method(s, 'retrieve');
    // pathParams: type change + wireName change
    retrieve.pathParams = [
      { name: 'pet_id', wireName: 'petId', type: { kind: 'scalar', scalar: 'integer' }, required: true },
    ];
    retrieve.headerParams = [
      // x_drop_me removed -> param-removed
      { name: 'x_trace', type: { kind: 'scalar', scalar: 'string' }, required: true }, // required flip
      { name: 'x_new', type: { kind: 'scalar', scalar: 'string' }, required: true }, // breaking add
    ];
    // download_photo loses its only path param
    method(s, 'download_photo').pathParams = [];
  });

  /* ---- request body: removed / added(req) / added(opt) ------------------- */
  specs['basic.body-presence'] = mut(basic, (s) => {
    delete method(s, 'create').requestBody; // body-removed
    method(s, 'retrieve').requestBody = {
      contentType: 'application/json',
      type: { kind: 'ref', name: 'CreatePetRequest' },
      required: true,
      encoding: 'json',
    }; // body-added (required -> breaking)
    method(s, 'download_photo').requestBody = {
      contentType: 'application/json',
      type: { kind: 'ref', name: 'CreatePetRequest' },
      required: false,
      encoding: 'json',
    }; // body-added (optional -> safe)
  });

  /* ---- request body: type / required-flip / encoding --------------------- */
  specs['basic.body-shape.base'] = mut(basic, (s) => {
    method(s, 'create').requestBody.required = false;
  });
  specs['basic.body-shape.head'] = mut(basic, (s) => {
    const body = method(s, 'create').requestBody;
    body.required = true; // body-required-flip
    body.type = { kind: 'array', items: { kind: 'ref', name: 'CreatePetRequest' } }; // body-type-changed
    body.encoding = 'multipart'; // body-encoding-changed
  });

  /* ---- response + pagination -------------------------------------------- */
  specs['basic.pagination.base'] = mut(basic, (s) => {
    method(s, 'retrieve').pagination = { style: 'page', itemsField: 'data' };
  });
  specs['basic.pagination.head'] = mut(basic, (s) => {
    delete method(s, 'list').pagination; // pagination-removed
    method(s, 'retrieve').pagination = { style: 'offset', itemsField: 'data' }; // style change
    method(s, 'list').primaryResponse = { kind: 'array', items: { kind: 'ref', name: 'PetList' } };
    // Deliberate negative: base has no pagination here, head does. The TS emits
    // NOTHING for a gained pagination (there is no `pagination-added` kind).
    method(s, 'create').pagination = { style: 'cursor', itemsField: 'data' };
  });

  /* ---- primaryResponse present/absent (typeKey 'none') ------------------- */
  specs['basic.primary-response'] = mut(basic, (s) => {
    delete method(s, 'download_photo').primaryResponse; // -> 'none'
    method(s, 'create').primaryResponse = null; // null is also 'none'
  });

  /* ---- the typeKey matrix ------------------------------------------------ */
  const TYPEKEY_BASE = [
    { name: 'p_scalar', type: { kind: 'scalar', scalar: 'string' } },
    { name: 'p_format', type: { kind: 'scalar', scalar: 'string', format: 'date-time' } },
    { name: 'p_const', type: { kind: 'scalar', scalar: 'string', const: 'auto' } },
    { name: 'p_const_null', type: { kind: 'scalar', scalar: 'string', const: null } },
    { name: 'p_ref', type: { kind: 'ref', name: 'Pet' } },
    { name: 'p_array', type: { kind: 'array', items: { kind: 'scalar', scalar: 'string' } } },
    { name: 'p_map', type: { kind: 'map', values: { kind: 'scalar', scalar: 'string' } } },
    { name: 'p_any', type: { kind: 'any' } },
    { name: 'p_missing_type' },
    { name: 'p_empty_format', type: { kind: 'scalar', scalar: 'string', format: '' } },
    { name: 'p_no_scalar', type: { kind: 'scalar' } },
    { name: 'p_array_missing_items', type: { kind: 'array' } },
    { name: 'p_unknown_kind', type: { kind: 'weird' } },
    { name: 'p_nullable_only', type: { kind: 'scalar', scalar: 'string', nullable: false } },
  ];
  const TYPEKEY_HEAD = [
    { name: 'p_scalar', type: { kind: 'scalar', scalar: 'integer' } },
    { name: 'p_format', type: { kind: 'scalar', scalar: 'string' } },
    { name: 'p_const', type: { kind: 'scalar', scalar: 'string', const: 7 } },
    { name: 'p_const_null', type: { kind: 'scalar', scalar: 'string' } },
    { name: 'p_ref', type: { kind: 'ref', name: 'PetList' } },
    { name: 'p_array', type: { kind: 'array', items: { kind: 'array', items: { kind: 'ref', name: 'Pet' } } } },
    { name: 'p_map', type: { kind: 'map', values: { kind: 'map', values: { kind: 'any' } } } },
    { name: 'p_any', type: { kind: 'scalar', scalar: 'string' } },
    { name: 'p_missing_type', type: { kind: 'scalar', scalar: 'string' } },
    { name: 'p_empty_format', type: { kind: 'scalar', scalar: 'string', format: 'uuid' } },
    { name: 'p_no_scalar', type: { kind: 'scalar', scalar: '' } },
    { name: 'p_array_missing_items', type: { kind: 'array', items: { kind: 'scalar', scalar: 'string' } } },
    { name: 'p_unknown_kind', type: { kind: 'other' } },
    // nullable is deliberately NOT part of typeKey -> no change expected here
    { name: 'p_nullable_only', type: { kind: 'scalar', scalar: 'string', nullable: true } },
  ];
  specs['basic.typekey.base'] = mut(basic, (s) => {
    method(s, 'list').queryParams = clone(TYPEKEY_BASE);
  });
  specs['basic.typekey.head'] = mut(basic, (s) => {
    method(s, 'list').queryParams = clone(TYPEKEY_HEAD);
  });

  /* ---- struct fields + type add/remove ----------------------------------- */
  specs['basic.struct-fields.base'] = mut(basic, (s) => {
    const pet = namedType(s, 'Pet');
    pet.fields = [
      { name: 'id', type: { kind: 'scalar', scalar: 'string' }, required: true },
      { name: 'name', type: { kind: 'scalar', scalar: 'string' }, required: true },
      { name: 'nickname', type: { kind: 'scalar', scalar: 'string' }, nullable: true },
      { name: 'legacy', type: { kind: 'scalar', scalar: 'string' } },
      { name: 'doomed', type: { kind: 'scalar', scalar: 'string' } },
    ];
  });
  specs['basic.struct-fields.head'] = mut(basic, (s) => {
    const pet = namedType(s, 'Pet');
    pet.fields = [
      // field-type-changed
      { name: 'id', type: { kind: 'scalar', scalar: 'integer' }, required: true },
      // field-required-flip (required -> optional)
      { name: 'name', type: { kind: 'scalar', scalar: 'string' }, required: false },
      // field-nullable-flip (nullable -> non-null)
      { name: 'nickname', type: { kind: 'scalar', scalar: 'string' } },
      // deprecated-added + nullable-flip (non-null -> nullable) + required flip (optional -> required)
      {
        name: 'legacy',
        type: { kind: 'scalar', scalar: 'string' },
        required: true,
        nullable: true,
        deprecated: true,
      },
      // `doomed` removed -> field-removed
      // field-added (required -> breaking)
      { name: 'owner_id', type: { kind: 'scalar', scalar: 'string' }, required: true },
      // field-added (optional -> safe)
      { name: 'note', type: { kind: 'scalar', scalar: 'string' } },
    ];
    // type-removed + type-added
    s.types = (s.types as Spec[]).filter((t) => t.name !== 'PetList');
    s.types.push({
      name: 'PetPage',
      kind: 'struct',
      fields: [{ name: 'items', type: { kind: 'array', items: { kind: 'ref', name: 'Pet' } } }],
    });
  });

  /* ---- enum values ------------------------------------------------------- */
  specs['basic.enum.base'] = mut(basic, (s) => {
    const st = namedType(s, 'PetStatus');
    st.values = [{ value: 'available' }, { value: 'pending' }, { value: 'sold' }, { value: 3 }, {}];
  });
  specs['basic.enum.head'] = mut(basic, (s) => {
    const st = namedType(s, 'PetStatus');
    // `pending`, `3` and `{}` removed (breaking), `adopted` + `4` added (risky).
    // The `{}` entry has no `value`, so JSON.stringify returns the JS value
    // `undefined` — the Set key is `undefined` and the path renders as
    // `types.PetStatus.undefined`.
    st.values = [{ value: 'available' }, { value: 'sold' }, { value: 'adopted' }, { value: 4 }];
  });

  /* ---- union variants ---------------------------------------------------- */
  specs['unions.variants'] = mut(unions, (s) => {
    const union = (s.types as Spec[]).find((t) => t.kind === 'union') as Spec;
    union.variants = [
      ...(union.variants as Spec[]).slice(1),
      { kind: 'scalar', scalar: 'string' },
      { kind: 'map', values: { kind: 'any' } },
    ];
  });

  /* ---- alias target + type kind flip ------------------------------------- */
  specs['basic.alias-kind.base'] = mut(basic, (s) => {
    s.types.push({ name: 'PetId', kind: 'alias', of: { kind: 'scalar', scalar: 'string' } });
    s.types.push({ name: 'PetRef', kind: 'alias', of: { kind: 'ref', name: 'Pet' } });
  });
  specs['basic.alias-kind.head'] = mut(basic, (s) => {
    // alias-target-changed
    s.types.push({ name: 'PetId', kind: 'alias', of: { kind: 'scalar', scalar: 'integer' } });
    // alias with the same target -> no change
    s.types.push({ name: 'PetRef', kind: 'alias', of: { kind: 'ref', name: 'Pet' } });
    // type-kind-changed: enum -> struct (short-circuits, no value diffing)
    const st = namedType(s, 'PetStatus');
    st.kind = 'struct';
    st.fields = [{ name: 'code', type: { kind: 'scalar', scalar: 'string' }, required: true }];
  });

  /* ---- root security + sdk behavior -------------------------------------- */
  specs['basic.root-security.head'] = mut(basic, (s) => {
    s.security = [{ type: 'apiKey', kind: 'apiKey-header', name: 'X-Api-Key', in: 'header' }];
    s.sdk = { retry: { maxRetries: 5 } };
  });
  // Same *observed* security tuple (kind/name/in/scheme), different ignored keys
  // (type/envVar/bearerFormat) -> secKey equal -> NO security change expected.
  specs['basic.root-security-noise.head'] = mut(basic, (s) => {
    s.security = [{ type: 'oauth2', kind: 'bearer', scheme: 'bearer', envVar: 'OTHER_KEY' }];
  });

  /* ---- duplicate keys: JS Map/Set collapse semantics --------------------- */
  specs['basic.dup-keys.base'] = mut(basic, (s) => {
    const ms = methodsOf(s);
    // two methods with the same action -> one Map entry (LAST value wins)
    ms.push({ action: 'list', httpMethod: 'get', path: '/pets/all', queryParams: [] });
    // duplicate param names
    method(s, 'retrieve').pathParams = [
      { name: 'pet_id', type: { kind: 'scalar', scalar: 'string' }, required: true },
      { name: 'pet_id', type: { kind: 'scalar', scalar: 'integer' }, required: true },
    ];
    // duplicate field names + duplicate enum values
    namedType(s, 'Pet').fields = [
      { name: 'id', type: { kind: 'scalar', scalar: 'string' }, required: true },
      { name: 'id', type: { kind: 'scalar', scalar: 'integer' }, required: false },
    ];
    namedType(s, 'PetStatus').values = [{ value: 'a' }, { value: 'a' }, { value: 'b' }];
    // duplicate resource names at the same level -> colliding method keys
    s.resources.push({
      name: 'pets',
      methods: [{ action: 'create', httpMethod: 'post', path: '/pets/dup' }],
    });
  });
  specs['basic.dup-keys.head'] = mut(basic, (s) => {
    method(s, 'retrieve').pathParams = [
      { name: 'pet_id', type: { kind: 'scalar', scalar: 'string' }, required: true },
    ];
    namedType(s, 'Pet').fields = [
      { name: 'id', type: { kind: 'scalar', scalar: 'string' }, required: true },
    ];
    namedType(s, 'PetStatus').values = [{ value: 'a' }, { value: 'b' }];
  });

  /* ---- JS coercion edges: nullish/truthy/join --------------------------- */
  specs['basic.coercion.base'] = mut(basic, (s) => {
    const list = method(s, 'list');
    list.queryParams = [
      { name: 'w_null', wireName: null, type: { kind: 'scalar', scalar: 'string' } },
      { name: 'w_empty', wireName: '', type: { kind: 'scalar', scalar: 'string' } },
      { name: 'w_same', wireName: 'w_same', type: { kind: 'scalar', scalar: 'string' } },
      { name: 'req_zero', required: 0, type: { kind: 'scalar', scalar: 'string' } },
      { name: 'req_str', required: 'yes', type: { kind: 'scalar', scalar: 'string' } },
      { name: 'dep_zero', deprecated: 0, type: { kind: 'scalar', scalar: 'string' } },
    ];
    namedType(s, 'Pet').fields = [
      { name: 'f_zero', required: 0, nullable: 0, type: { kind: 'scalar', scalar: 'string' } },
      { name: 'f_str', required: 'false', type: { kind: 'scalar', scalar: 'string' } },
      { name: 'f_missing', type: { kind: 'scalar', scalar: 'string' } },
    ];
    // resource with no methods + nested empty resources (walkMethods edge)
    s.resources.push({ name: 'empty', resources: [{ name: 'deeper', methods: [] }] });
  });
  specs['basic.coercion.head'] = mut(basic, (s) => {
    const list = method(s, 'list');
    list.queryParams = [
      // null wireName -> `?? name`; absent -> `?? name`. Both resolve to `w_null`: no change.
      { name: 'w_null', type: { kind: 'scalar', scalar: 'string' } },
      // '' is NOT nullish -> '' vs 'w_empty' -> risky wire-name change
      { name: 'w_empty', type: { kind: 'scalar', scalar: 'string' } },
      { name: 'w_same', wireName: 'w_same', type: { kind: 'scalar', scalar: 'string' } },
      // 0 (falsy) -> absent (falsy): no required flip
      { name: 'req_zero', type: { kind: 'scalar', scalar: 'string' } },
      // 'yes' (truthy) -> absent (falsy): `!b.required && h.required` is false -> no change
      { name: 'req_str', type: { kind: 'scalar', scalar: 'string' } },
      // 0 -> true: deprecated-added
      { name: 'dep_zero', deprecated: true, type: { kind: 'scalar', scalar: 'string' } },
    ];
    namedType(s, 'Pet').fields = [
      // 0 -> absent: !!0 === !!undefined -> no flips
      { name: 'f_zero', type: { kind: 'scalar', scalar: 'string' } },
      // 'false' is TRUTHY -> required -> optional
      { name: 'f_str', required: false, type: { kind: 'scalar', scalar: 'string' } },
      // absent -> null: !!undefined === !!null -> no flip
      { name: 'f_missing', required: null, nullable: null, type: { kind: 'scalar', scalar: 'string' } },
    ];
    // resource/method with missing names: methodKey uses Array.join (null/undefined -> '')
    s.resources.push({ name: 'empty', resources: [{ methods: [{ httpMethod: 'get', path: '/x' }] }] });
  });

  /* ---- ECMAScript number formatting in stringified positions ------------- */
  // `diffIR` funnels enum values, TypeRef `const`, `sdk` and per-operation
  // `security` through JSON.stringify, so JS's Number::toString is part of the
  // contract: there is ONE number type, `1.0` prints as "1", 1e21 prints as
  // "1e+21" and 1e-7 as "1e-7". A port that leans on its own float formatting
  // both mis-compares specs and mis-renders change paths.
  //
  // `RAW(...)` survives the writer verbatim (see `writeRawNumbers`), so the
  // committed fixture really does contain `1.0` / `-0.0` rather than the `1` /
  // `0` that JSON.stringify would collapse them to.
  specs['basic.numbers.base'] = mut(basic, (s) => {
    const st = namedType(s, 'PetStatus');
    st.values = [
      { value: RAW('1.0') }, // === 1 in JS: must NOT read as a change
      { value: 1e21 }, // path segment "1e+21"
      { value: 1e-7 }, // path segment "1e-7"
      { value: 0.000001 }, // path segment "0.000001" (the -6 exponent boundary)
      { value: RAW('-0.0') }, // path segment "0"
      { value: 1.5e300 },
      { value: 123456789012345678901234567890 },
      { value: 1.25 },
    ];
    method(s, 'list').queryParams = [
      { name: 'limit', type: { kind: 'scalar', scalar: 'integer', const: RAW('10.0') } },
    ];
    s.sdk = { retry: { maxRetries: RAW('2.0') }, pagination: { autoPageDelayMs: RAW('-0.0') } };
    method(s, 'create').security = [{ type: 'apiKey', kind: 'apiKey-header', ttl: RAW('60.0') }];
  });
  specs['basic.numbers.head'] = mut(basic, (s) => {
    const st = namedType(s, 'PetStatus');
    // Only `1.0`/`1` and `1.25` survive; everything else is removed and `2` added.
    st.values = [{ value: 1 }, { value: 1.25 }, { value: 2 }];
    method(s, 'list').queryParams = [
      { name: 'limit', type: { kind: 'scalar', scalar: 'integer', const: 10 } },
    ];
    s.sdk = { retry: { maxRetries: 2 }, pagination: { autoPageDelayMs: 0 } };
    method(s, 'create').security = [{ type: 'apiKey', kind: 'apiKey-header', ttl: 60 }];
  });

  /* ---- JSON.stringify ordering + JS reference identity ------------------- */
  // Three separate semantics that a port silently gets wrong:
  //   * JS enumerates array-index keys FIRST, in ascending numeric order — so
  //     two `statusCodeMap`s written in different orders stringify identically
  //     and are NOT a change;
  //   * JSON.stringify DROPS undefined properties but keeps explicit nulls, so
  //     an absent `name` and `name: null` are different security tuples;
  //   * `!==` on objects is reference identity, so two structurally identical
  //     `encoding` objects from two documents ARE a change.
  specs['basic.stringify.base'] = mut(basic, (s) => {
    s.sdk = {
      errors: { statusCodeMap: RAWJSON('{"429":"RateLimited","400":"BadRequest","10":"X"}') },
      note: 'a',
    };
    s.security = [{ type: 'http', kind: 'bearer', scheme: 'bearer' }];
    method(s, 'create').security = [{ kind: 'x', meta: RAWJSON('{"2":1,"1":2}') }];
    method(s, 'create').requestBody.encoding = { name: 'json' };
    s.types.push({
      name: 'Weird',
      kind: 5, // a non-string kind: equal on both sides, so the TS dispatches nowhere
      fields: [{ name: 'a', type: { kind: 'scalar', scalar: 'string' } }],
    });
  });
  specs['basic.stringify.head'] = mut(basic, (s) => {
    // Same numeric keys, different document order -> JS hoists+sorts -> EQUAL.
    s.sdk = {
      errors: { statusCodeMap: RAWJSON('{"10":"X","400":"BadRequest","429":"RateLimited"}') },
      note: 'a',
    };
    // `name: null` is kept by JSON.stringify where an absent `name` is dropped.
    s.security = [{ type: 'http', kind: 'bearer', name: null, scheme: 'bearer' }];
    method(s, 'create').security = [{ kind: 'x', meta: RAWJSON('{"1":2,"2":1}') }];
    method(s, 'create').requestBody.encoding = { name: 'json' };
    s.types.push({
      name: 'Weird',
      kind: 5,
      fields: [{ name: 'b', type: { kind: 'scalar', scalar: 'integer' }, required: true }],
    });
  });

  /* ---- the realistic large mutation battery ------------------------------ */
  specs['openai-mixed.mutated'] = mut(openaiMixed, (s) => {
    // method-removed: drop the first method of the first top-level resource
    const first = s.resources[0];
    const dropFrom = (node: Spec): boolean => {
      if (node.methods?.length) {
        node.methods.shift();
        return true;
      }
      for (const child of node.resources || []) if (dropFrom(child)) return true;
      return false;
    };
    dropFrom(first);

    // method-added
    first.methods = first.methods || [];
    first.methods.push({ action: 'ping', httpMethod: 'get', path: '/ping' });

    // walk every method and perturb the first few deterministically
    const all: Spec[] = [];
    const walk = (rs: Spec[] | undefined) => {
      for (const r of rs || []) {
        for (const m of r.methods || []) all.push(m);
        walk(r.resources);
      }
    };
    walk(s.resources);
    all.forEach((m, i) => {
      if (i % 7 === 0) m.deprecated = true;
      if (i % 5 === 1) m.path = `${m.path}/v2`;
      if (i % 5 === 2 && m.queryParams?.length) {
        m.queryParams[0].required = true;
        m.queryParams[0].wireName = `${m.queryParams[0].name}[]`;
      }
      if (i % 5 === 3 && m.queryParams?.length) m.queryParams.shift();
      if (i % 5 === 4) {
        m.queryParams = m.queryParams || [];
        m.queryParams.push({ name: 'x_new', type: { kind: 'scalar', scalar: 'string' }, required: true });
      }
      if (i % 11 === 0 && m.requestBody) m.requestBody.encoding = 'form';
      if (i % 11 === 3 && m.primaryResponse) {
        m.primaryResponse = { kind: 'array', items: m.primaryResponse };
      }
      if (i % 11 === 5 && m.pagination) m.pagination.style = 'offset';
    });

    // types: remove some, add one, and perturb fields/values/variants/aliases
    const types = s.types as Spec[];
    s.types = types.filter((_t, i) => i % 17 !== 0);
    (s.types as Spec[]).forEach((t, i) => {
      if (t.kind === 'struct' && t.fields?.length) {
        if (i % 3 === 0) t.fields[0].required = !t.fields[0].required;
        if (i % 3 === 1) t.fields[0].nullable = !t.fields[0].nullable;
        if (i % 5 === 0 && t.fields.length > 1) t.fields.pop();
        if (i % 5 === 1) t.fields.push({ name: 'x_added', type: { kind: 'scalar', scalar: 'string' } });
        if (i % 5 === 2) t.fields.push({ name: 'x_req', type: { kind: 'scalar', scalar: 'string' }, required: true });
        if (i % 7 === 0) t.fields[0].type = { kind: 'any' };
        if (i % 7 === 1) t.fields[0].deprecated = true;
      }
      if (t.kind === 'enum' && t.values?.length) {
        if (i % 2 === 0 && t.values.length > 1) t.values.pop();
        if (i % 2 === 1) t.values.push({ value: 'x_added_value' });
      }
      if (t.kind === 'union' && t.variants?.length) {
        if (i % 2 === 0 && t.variants.length > 1) t.variants.pop();
        else t.variants.push({ kind: 'scalar', scalar: 'string' });
      }
      if (t.kind === 'alias') t.of = { kind: 'array', items: t.of };
      if (i % 23 === 0) t.kind = t.kind === 'struct' ? 'alias' : 'struct';
    });
    (s.types as Spec[]).push({ name: 'BrandNewType', kind: 'struct', fields: [] });

    // root security + sdk behavior
    s.security = [{ type: 'apiKey', kind: 'apiKey-query', name: 'key', in: 'query' }];
    s.sdk = { retry: { maxRetries: 9 }, timeout: { defaultTimeoutMs: 1000 } };
  });

  return specs;
}

/** The `(name, base spec, head spec)` triples that become fixture cases. */
export const CASES: { name: string; base: string; head: string }[] = [
  // identity
  { name: '01.identical-basic', base: 'basic', head: 'basic' },
  { name: '02.identical-openai-mixed', base: 'openai-mixed', head: 'openai-mixed' },
  // real cross-fixture pairs
  { name: '03.cross-basic-wire', base: 'basic', head: 'wire' },
  { name: '04.cross-unions-basic', base: 'unions', head: 'basic' },
  { name: '05.cross-sdk-behavior-x-open-sdk', base: 'sdk-behavior', head: 'x-open-sdk' },
  { name: '06.cross-unions-sdk-behavior-pagination', base: 'unions', head: 'sdk-behavior-pagination' },
  {
    name: '07.cross-openai-ops',
    base: 'openai-conversations-update',
    head: 'openai-conversations-items-delete',
  },
  // realistic large
  { name: '08.openai-mixed-vs-subset', base: 'openai-mixed', head: 'openai-mixed-subset' },
  { name: '09.openai-mixed-vs-mutated', base: 'openai-mixed', head: 'openai-mixed.mutated' },
  // synthesized single-area mutations
  { name: '10.method-shape', base: 'basic', head: 'basic.methods' },
  { name: '11.query-params', base: 'basic', head: 'basic.query-params' },
  {
    name: '12.path-header-params',
    base: 'basic.path-header-params.base',
    head: 'basic.path-header-params.head',
  },
  { name: '13.body-presence', base: 'basic', head: 'basic.body-presence' },
  { name: '14.body-shape', base: 'basic.body-shape.base', head: 'basic.body-shape.head' },
  { name: '15.pagination-response', base: 'basic.pagination.base', head: 'basic.pagination.head' },
  { name: '16.primary-response-none', base: 'basic', head: 'basic.primary-response' },
  { name: '17.typekey-matrix', base: 'basic.typekey.base', head: 'basic.typekey.head' },
  { name: '18.struct-fields', base: 'basic.struct-fields.base', head: 'basic.struct-fields.head' },
  { name: '19.enum-values', base: 'basic.enum.base', head: 'basic.enum.head' },
  { name: '20.union-variants', base: 'unions', head: 'unions.variants' },
  { name: '21.alias-and-type-kind', base: 'basic.alias-kind.base', head: 'basic.alias-kind.head' },
  { name: '22.root-security-and-sdk', base: 'basic', head: 'basic.root-security.head' },
  { name: '23.root-security-noise', base: 'basic', head: 'basic.root-security-noise.head' },
  { name: '24.duplicate-keys', base: 'basic.dup-keys.base', head: 'basic.dup-keys.head' },
  { name: '25.js-coercion-edges', base: 'basic.coercion.base', head: 'basic.coercion.head' },
  { name: '26.js-number-formats', base: 'basic.numbers.base', head: 'basic.numbers.head' },
  { name: '27.stringify-and-identity', base: 'basic.stringify.base', head: 'basic.stringify.head' },
];
