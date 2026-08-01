# @xyd-js/opensdk-merge

A tiny 3-way line-merge primitive for OpenSDK regeneration: contribute custom
code to a generated SDK *and* keep regenerating. Hand-edits to generated files
survive re-generation; genuine overlaps become resolvable conflicts.

## `merge3(base, ours, theirs, opts?)`

Reconciles the user's on-disk edits (`ours`) with a freshly generated file
(`theirs`) against their common ancestor (`base` — the previously-generated
pristine content).

```ts
import { merge3 } from '@xyd-js/opensdk-merge'

const r = merge3(prevGenerated, onDisk, newGenerated, {
  labels: { ours: 'your edits', theirs: 'generated' },
})
r.text        // merged content (with <<<<<<< / ======= / >>>>>>> markers on conflict)
r.clean       // true when there were no conflicts
r.conflicts   // number of conflict regions
```

- Changes only **one** side made are applied; a region **both** sides changed
  *differently* becomes a git-style conflict block.
- Line-oriented and deterministic (never reorders unchanged lines), so a no-op
  regen stays byte-stable.
- The 3-way diff is jsdiff's battle-tested `merge()` (built with `context: 0` so
  nearby edits don't produce false conflicts); this package renders its
  structured output back to file text with markers you control.

Also exported: `isProbablyBinary(s)` (skip-merge guard), `normalizeNewlines(s)`,
`hasConflictMarkers(s)`.

## Two layers of custom-code support

| Mechanism | What it does | Where |
|---|---|---|
| **`.sdkignore`** | Whole-file protection (gitignore-style). A matched file is never overwritten or pruned; a generated-vs-yours difference is reported as a *conflict warning*, but the file is frozen — it stops receiving generator updates. | `@xyd-js/opensdk-framework` `writeProject` |
| **`opensdk generate --merge`** (this package) | Per-file **3-way merge**. An edited generated file keeps receiving generator updates *and* your edits; only true overlaps conflict. Uses a base snapshot under `.sdk/base/`. | `writeProject({ merge: true })` → `merge3` |

Use `.sdkignore` for files you fully own; use `--merge` for generated files you
want to tweak but keep in sync.
