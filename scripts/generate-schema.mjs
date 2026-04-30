import { createGenerator } from 'ts-json-schema-generator';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve('.');
const SETTINGS_PATH = join(ROOT, 'packages/xyd-core/src/types/settings.ts');
const TEMP_PATH = join(ROOT, 'packages/xyd-core/src/types/settings.schema.ts');
const OUTPUT_PATH = join(ROOT, 'apps/docs/public/docs.json');

// Read the original settings file
let source = readFileSync(SETTINGS_PATH, 'utf-8');

// Replace the vite import with a type alias pointing to ViteUserConfigInline.
// ViteUserConfigInline is defined in the same file as a schema-safe subset.
source = source.replace(
  /import\s+type\s*\{[^}]*UserConfig\s+as\s+ViteUserConfig[^}]*\}\s*from\s*["']vite["'];?\s*/,
  'type ViteUserConfig = ViteUserConfigInline;\n'
);

// Write modified file next to the original so all imports resolve correctly
writeFileSync(TEMP_PATH, source);

try {
  const schema = createGenerator({
    path: TEMP_PATH,
    type: 'Settings',
    topRef: false,
    skipTypeCheck: true,
    sortProps: true,
  }).createSchema('Settings');

  // Sort all object keys alphabetically to match the previous CLI output format
  const sortedJson = JSON.stringify(schema, (_, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const sorted = {};
      for (const key of Object.keys(value).sort()) {
        sorted[key] = value[key];
      }
      return sorted;
    }
    return value;
  }, 2);

  writeFileSync(OUTPUT_PATH, sortedJson + '\n');
  console.log(`Schema written to ${OUTPUT_PATH}`);
} finally {
  rmSync(TEMP_PATH, { force: true });
}
