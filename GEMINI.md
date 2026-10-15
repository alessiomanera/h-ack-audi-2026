<!-- GENERATED from .agents/AGENTS.md by `npm run agents:sync`. Edit .agents/AGENTS.md, never this file. -->

# h-ack-audi-2026: rules for AI agents

One rulebook for Claude Code, Antigravity and Gemini CLI. `GEMINI.md` is a generated copy (`npm run agents:sync`), so edit only this file. The repo is archived; these rules document how the team worked.

## The project

A team of 8 (Alessio, Evelyn, Simone, Valeria, Aurora, Dori, Nicola, Alberto) at the Audi x H-FARM hackathon "H-ACK | Co-Design the Future" (Sat 10 Oct 2026). Deliverable: one digital solution answering one of four official briefs (a clickable prototype living in Audi's existing channels, never a dedicated app, plus a deck of at most 10 slides), pitched in Italian in 5 minutes. We chose Brief 4 (post-purchase loyalty, under 35) and built **Audi with you** (`app/`).

## Facts versus hypotheses

- The official brief and rules are the only ground truth and are not part of this repo. When they conflict with anything else, they win.
- Notes in `knowledge/` and `pitch/` are team work. Numbers reach a deliverable only with a primary source and year; label US or German data as such.

## Language

Deliverables (UI copy, slides, pitch script) are in **Italian**: the project was made for Audi Italia only. Agent files, code identifiers and commit messages are in English.

## Working on the shared codebase (several people, several agents)

1. **Every change belongs to a task** in `tasks/T###-slug.md`. Read its `scope` (globs you may modify), `acceptance` and `verify` before touching code.
2. **Stay inside `scope`.** When the work needs a file outside it, stop and add a note under `## Blockers` in the task file.
3. **Claim by push**: set `status: doing` and `owner`, commit, push. A rejected push means someone else moved first: pull and re-read the board (`npm run tasks:board`).
4. **Hot files** change only in a task owned by the repo owner: `package.json`, `package-lock.json`, `app/src/design/**`, `app/src/state/**`, `brand/tokens.*`, `.agents/**`.
5. **Features are Lego blocks**: each lives in `app/src/features/<name>/` with its own `index.ts`, `copy.it.ts` and tests, and registers itself through `import.meta.glob`.
6. **Branches**: humans commit to `testing`; `main` is the stable version and moves only by an approved PR.
7. **Commits**: `type(T###): summary`, authored by the human's git identity, with no AI co-author trailer.

Log significant AI-generated assets (images, copy) in `pitch/ai-usage.md`: tool, prompt, what a human refined.

## Privacy

Committed files carry first names only. No emails, phone numbers, addresses, tokens or raw meeting notes in git. Secrets live in `.dev.vars` or GitHub secrets. `scripts/privacy-scan.mjs` blocks violations (run in CI).

## Design and code

- Conventional design: shadcn/Radix components themed from `brand/tokens.css`; standard mobile navigation; distinctiveness lives in color, type and imagery.
- Dark-first, one red (`lava`) element per screen, 1px hairlines, Archivo headings, Inter body. `text-wrap: balance` on headings, `pretty` on paragraphs.
- TypeScript strict, no `any`. UI stays separate from state and data. Each feature ships with a Vitest test.
- Write without em-dashes (use commas, colons, parentheses).
