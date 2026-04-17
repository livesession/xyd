# Type Transformation System

Converts TypeDoc type info from full Uniform to simplified "mini" format for documentation rendering.

## Core Function: uniformToMiniUniform

| Phase | Operation |
|-------|-----------|
| Collection | Build refBySymbolId lookup map |
| Filtering | Select refs matching rootSymbolName |
| Definition Processing | Create mini definitions |
| Property Resolution | Resolve all properties recursively |

## Property Resolution

resolveProperty: recursive with depth limit (10) and visited Set for circular reference detection.

- Array types: resolve ofProperty recursively
- Symbol IDs: lookup in refBySymbolId, extract definitions
- Union types: split and resolve each member

## Union Type Processing

Detection: multiple symbolDef.id values or union type strings. Two-pass: process symbol IDs first, then remaining type strings.

## Type Simplification

shortMergedType merges simple unions (primitives/literals) into compact strings. Primitives: string, number, boolean, null, undefined, any, unknown, void, never.

## Output Format

Mini uniform: title from symbolName, canonical cleared to "", fully resolved properties. States: fully expanded, union, array, simple, or circular reference (empty).

## Performance

O(1) lookup via hash map, depth limiting, visited tracking, early return, deep cloning during collection.
