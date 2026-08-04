// Usage: node scripts/frontmatter-dual-run-gate.mjs <content-dir>
// Validates crates/xyd_frontmatter's frontmatter_batch against the JS
// getFrontmatter (MDX compile) over a real content corpus. Exit 1 on any
// value mismatch. Proven 0-mismatch across apps/docs (84), e2e nav/writing
// (19), and 625 generated OpenAPI virtual pages.
// Dual-run parity gate (S6+ W4 slice B): JS getFrontmatter (MDX compile) vs
// the Rust frontmatter_batch, over a real content corpus. Asserts per-file
// deep-equal on the ACCEPTED (fast-path) files, and that deferred/throw/missing
// classifications agree with the JS path's behavior.
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { compile as mdxCompile } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const native = require("@xyd-js/native");

function mdxExport(code) {
  const scope = { Fragment: React.Fragment, jsxs: React.createElement, jsx: React.createElement, jsxDEV: React.createElement };
  return new Function(...Object.keys(scope), code)(scope);
}
async function jsGetFrontmatter(filePath) {
  const body = await fs.readFile(filePath, "utf-8");
  const compiled = await mdxCompile({ path: filePath, value: body }, {
    remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
    outputFormat: "function-body", development: false,
  });
  const { frontmatter } = mdxExport(String(compiled));
  if (!frontmatter) throw new Error("no frontmatter");
  return frontmatter;
}

const CORPUS = process.argv[2];
async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".xyd") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.name.endsWith(".md") || e.name.endsWith(".mdx")) out.push(p);
  }
  return out;
}

const files = await walk(CORPUS);
const batch = JSON.parse(native.frontmatterBatch(JSON.stringify(files)));

let ok = 0, deferred = 0, threw = 0, mismatches = 0, fastMatch = 0;
for (const f of files) {
  const entry = batch[f];
  let js, jsThrew = false;
  try { js = await jsGetFrontmatter(f); } catch { jsThrew = true; }

  if (entry.status === "throw") {
    if (!jsThrew) { mismatches++; console.log("MISMATCH (rust=throw, js=ok):", f, JSON.stringify(js)); }
    else threw++;
    continue;
  }
  if (entry.status === "fallback") { deferred++; continue; }
  if (entry.status === "missing") { console.log("unexpected missing:", f); mismatches++; continue; }
  // status ok — compare deep-equal to JS
  ok++;
  if (jsThrew) { mismatches++; console.log("MISMATCH (rust=ok, js=throw):", f); continue; }
  const a = JSON.stringify(js), b = JSON.stringify(entry.frontmatter);
  // order-insensitive compare
  const norm = (o) => JSON.stringify(Object.keys(o).sort().reduce((m,k)=>(m[k]=o[k],m),{}));
  if (norm(js) === norm(entry.frontmatter)) { fastMatch++; }
  else { mismatches++; console.log("VALUE MISMATCH:", f, "\n  js:  ", a, "\n  rust:", b); }
}
console.log(`\nfiles=${files.length} fast-path-match=${fastMatch} throw-agree=${threw} deferred-to-js=${deferred} MISMATCHES=${mismatches}`);
process.exit(mismatches > 0 ? 1 : 0);
