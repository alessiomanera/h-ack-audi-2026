#!/usr/bin/env node
// Regenerates tasks/BOARD.md from the frontmatter of tasks/T###-*.md. No dependencies.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const DIR = join(ROOT, "tasks");
const ORDER = ["doing", "review", "todo", "done"];

function frontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text.replace(/\r\n/g, "\n"));
  const out = {};
  if (!m) return out;
  for (const line of m[1].split("\n")) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const tasks = readdirSync(DIR)
  .filter((f) => /^T\d{3}-.*\.md$/.test(f))
  .map((f) => ({ file: f, ...frontmatter(readFileSync(join(DIR, f), "utf8")) }))
  .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.file.localeCompare(b.file));

const rows = tasks.map(
  (t) => `| ${t.id ?? "?"} | [${t.title ?? t.file}](${t.file}) | ${t.status ?? "?"} | ${t.owner || "-"} | ${t.executor || "-"} | ${t.branch || "-"} |`,
);
const body = [
  "# Task board",
  "",
  "Generato da `npm run tasks:board`. Non modificare a mano: cambia il frontmatter del task.",
  "",
  "| ID | Task | Stato | Owner | Esecutore | Branch |",
  "|---|---|---|---|---|---|",
  ...(rows.length ? rows : ["| - | nessun task | - | - | - | - |"]),
  "",
].join("\n");
writeFileSync(join(DIR, "BOARD.md"), body, "utf8");
console.log(`tasks/BOARD.md: ${tasks.length} task.`);
