#!/usr/bin/env node
// GEMINI.md (read by Antigravity and Gemini CLI) is a generated copy of .agents/AGENTS.md.
//   npm run agents:sync          regenerate
//   node scripts/agents-sync.mjs --check   exit 1 if out of date (pre-commit, ship)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./history.mjs";

const SRC = join(ROOT, ".agents", "AGENTS.md");
const OUT = join(ROOT, "GEMINI.md");
const BANNER =
  "<!-- GENERATED from .agents/AGENTS.md by `npm run agents:sync`. Edit .agents/AGENTS.md, never this file. -->\n\n";

const expected = BANNER + readFileSync(SRC, "utf8");
const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";

if (process.argv.includes("--check")) {
  if (current !== expected) {
    console.error("GEMINI.md non e' allineato a .agents/AGENTS.md: esegui `npm run agents:sync`.");
    process.exit(1);
  }
  console.log("agents-sync: GEMINI.md allineato.");
} else {
  writeFileSync(OUT, expected, "utf8");
  console.log("GEMINI.md rigenerato da .agents/AGENTS.md");
}
