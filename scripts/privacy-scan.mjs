#!/usr/bin/env node
// Blocks secrets and personal data before they reach git.
//   node scripts/privacy-scan.mjs --staged   (pre-commit: staged content only)
//   node scripts/privacy-scan.mjs --all      (every tracked file; used by `npm run ship` and the final privacy gate)
// Exit 1 on findings. Em-dashes in authored files are reported as warnings only.
import { execFileSync } from "node:child_process";
import { findings } from "./lib/privacy.mjs";

const BINARY = /\.(png|jpe?g|webp|gif|ico|pdf|woff2?|ttf|otf|mp4|mov|zip)$/i;
// Mirrors and fixed sources are other people's text: em-dash warnings there are noise.
const DASH_EXEMPT = /^(knowledge\/|docs\/WORKFLOW\.md|HISTORY\.md|package-lock\.json)/;

const git = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const staged = process.argv.includes("--staged");

const files = (staged
  ? git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"])
  : git(["ls-files"])
)
  .split("\n")
  .filter((f) => f && !BINARY.test(f));

let blocked = 0;
let dashWarnings = 0;
for (const file of files) {
  let text;
  try {
    text = staged ? git(["show", `:${file}`]) : git(["show", `HEAD:${file}`]);
  } catch {
    continue;
  }
  for (const hit of findings(text)) {
    blocked++;
    console.error(`BLOCCATO  ${file}:${hit.line}  ${hit.id}  (${hit.sample})`);
  }
  if (!DASH_EXEMPT.test(file) && text.includes("—")) {
    dashWarnings++;
    console.warn(`avviso    ${file}: contiene em-dash, sostituisci con virgola, due punti o parentesi`);
  }
}

if (blocked) {
  console.error(`\n${blocked} dato/i sensibile/i trovato/i. Rimuovili (o spostali in _PERSONAL/ o .dev.vars) e riprova.`);
  process.exit(1);
}
console.log(`privacy-scan: ${files.length} file controllati, nessun dato sensibile${dashWarnings ? `, ${dashWarnings} avvisi em-dash` : ""}.`);
