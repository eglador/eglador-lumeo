import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const files = ["../dist/index.js", "../dist/index.cjs"];

let ok = true;
for (const rel of files) {
  const file = path.join(root, rel);
  const content = readFileSync(file, "utf8");
  if (!content.trimStart().startsWith('"use client"')) {
    console.error(`Missing "use client" banner at top of ${rel}`);
    ok = false;
  }
}

if (!ok) {
  process.exit(1);
}
console.log('"use client" banner verified in dist output.');
