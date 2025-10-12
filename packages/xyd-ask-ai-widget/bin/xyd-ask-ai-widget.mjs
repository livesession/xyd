#!/usr/bin/env node

if (process.argv.includes("--standalone")) {
  import("../dist/server-standalone.js");
} else {
  import("../dist/server.js");
}
