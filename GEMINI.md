<!-- GENERATED from .agents/AGENTS.md by `npm run agents:sync`. Edit .agents/AGENTS.md, never this file. -->

# h-ack-audi-2026: rules for every AI agent

One rulebook for Claude Code, Antigravity and Gemini CLI. `CLAUDE.md` imports this file; `GEMINI.md` is a generated copy (`npm run agents:sync`), so edit only this file.

## The project

An 8-person team (Alessio, Evelyn, Simone, Valeria, Aurora, Sofi, Nicola, Alberto) at the Audi x H-FARM hackathon "H-ACK | Co-Design the Future" (Sat 10 Oct 2026, 08:30-20:30). Deliverable: one *soluzione digitale* answering ONE of the four official briefs (a clickable prototype living in Audi's existing channels, never a dedicated app, plus a Canva deck of at most 10 slides) pitched in Italian in 5 minutes by 1-2 people, only if the mentors select us, to a jury scoring IDEA, PRODUCT, EXECUTION, COHERENCE, ATTITUDE (1-10 each juror, summed). All IP passes to Volkswagen Group Italia (rules art. 10).

## Facts versus hypotheses

- **Fixed** (the only ground truth): `knowledge/fixed/` = the official brief (`brief.md`, start here), the Audi Italia marketing director's speech, the event-day rules, jury and mentors (`jury.md`), the organizers' links. Original PDFs in `knowledge/fixed/sources/`. When they conflict with anything else, they win.
- **Hypotheses**: `knowledge/team-doc/` (mirror of the team Google Doc) and `knowledge/prep/`. Treat every concept, plan and juror profile there as a team guess to test against the brief. Start from `knowledge/team-doc/INDEX.md` and open only the tab you need.
- **Numbers** reach a deliverable only with a primary source and year; label US or German data as such.

## Language

Deliverables (UI copy, slides, pitch script, anything written to the Google Doc) are in **Italian**. Agent files, code identifiers and commit messages are in English. Reply to the human in the language they use.

## Where things live

`docs/WORKFLOW.md` (mirror of the Google Doc WORKFLOW tab) is the team's operating manual: roles, tools, sync points, Saturday plan. `knowledge/README.md` maps the knowledge base. `brand/tokens.json` is the single source for colors and fonts; `brand/voice.md` for tone.

## Who runs which agent

- **Alessio**: Gemini in Antigravity is his main tool on the repo; Claude is reserved for at most two 5-hour sessions on Saturday (planning, review, pitch). Claude's job there is to write task files that Antigravity executes.
- **Evelyn**: Claude Code Pro.
- **Google Doc access** exists only through Claude's connectors. Gemini and Antigravity read the Doc through the mirror in `knowledge/team-doc/`; when it looks stale, they run `npm run align:git -- --pull` and ask a Claude user (Alessio or Evelyn) to run "allinea".
- Keep sessions lean: read `INDEX.md` files and the task file first, open only what the task needs.

## Working on the shared codebase (up to 3 people, several agents)

1. **Every change belongs to a task** in `tasks/T###-slug.md`. Read its `scope` (globs you may modify), `acceptance` and `verify` before touching code.
2. **Stay inside `scope`.** When the work needs a file outside it, stop and append a note under `## Blockers` in the task file for the owner.
3. **Claim by push**: set `status: doing` and `owner`, commit, push. A rejected push means someone else moved first: pull and re-read the board.
4. **Hot files** change only in a task owned by Alessio: `package.json`, `package-lock.json`, `app/src/design/**`, `app/src/state/**`, `brand/tokens.*`, `.agents/**`, `.claude/settings.json`. New dependencies are frozen from Friday night.
5. **Features are Lego blocks**: each lives in `app/src/features/<name>/` with its own `index.ts`, `copy.it.ts` and tests, and registers itself through `import.meta.glob`. Create screens with `npm run new:screen <feature> <screen>`.
6. **Branches**: humans commit to `testing`; an executor agent works in its own git worktree on branch `t###-slug`, merged into `testing` after review. `main` is the jury URL: it moves only by a PR Alessio approves. Freeze at 18:00 on Saturday.
7. **Before pushing** run `npm run ship` (typecheck, tests, privacy scan, rulebook sync, rebase, push).
8. **Commits**: `type(T###): summary`, authored by the human's git identity, with no AI co-author trailer.

## Session history

`HISTORY.md` records who asked what, for the jury's "how did you work?". Claude Code logs itself through hooks. **Any other agent** (Antigravity, Gemini CLI) logs each task prompt it receives before starting work:

```sh
npm run log -- --tool antigravity --task T012 "<the prompt you received>"
```

Log significant AI-generated assets (images, video, copy) in `pitch/ai-usage.md`: tool, prompt, what a human refined.

## The team Google Doc

ID `[team-doc-id]`. The `align` skill owns syncing (read `.claude/skills/align/SKILL.md` if you are not Claude). Writes follow one policy:

- Inside the WORKFLOW tab's 🔒 blocks (between `⟦REPO:name⟧` and `⟦/REPO⟧` markers) and its "Registro allineamenti": direct edits, always with `requiredRevisionId`.
- Everywhere else: `writeMode: SUGGEST`, so the author accepts or rejects.

## Privacy (the repo is private now, may go public later)

Committed files carry first names only. Keep emails, phone numbers, addresses, tokens and raw meeting notes out of git: raw notes go to `_PERSONAL/` (gitignored) or Drive, and only decision summaries enter `knowledge/decisions/`. Secrets live in `.dev.vars` or GitHub secrets. The pre-commit hook runs `scripts/privacy-scan.mjs` and blocks violations.

## Design and code

- Conventional design: shadcn/Radix components themed from `brand/tokens.css`; standard mobile navigation; distinctiveness lives in color, type and imagery.
- Dark-first, one red (`lava`) element per screen, 1px hairlines, Archivo headings, Inter body. `text-wrap: balance` on headings, `pretty` on paragraphs.
- TypeScript strict, no `any`. UI stays separate from state and data. Each feature ships with a Vitest test.
- Write without em-dashes (use commas, colons, parentheses).
- On Windows, run npm through `cmd /c` from background tools.

## Skills (Claude Code; other agents can read the SKILL.md and follow it)

`align` (sync repo, GitHub and Google Doc), `decode-brief`, `jury-panel`, `brand-guard`, `asset-prompt`, `plan-task`, `review-task`, `pitch-deck`, `ingest-call`, all in `.claude/skills/`.
