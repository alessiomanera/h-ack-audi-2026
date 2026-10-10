// @vitest-environment node
// Brief and mentor rules, checked on every source file of the feature (tests and fixtures excluded):
// no dashes as punctuation, the product is never called an "app", no forbidden mechanics in copy,
// and the lava signal color lives in one file only.
// Files are read with Vite's import.meta.glob (?raw), recursively from this folder: same result as
// node:fs, without pulling Node types into the browser tsconfig.
import ts from 'typescript'

const RAW = import.meta.glob<string>(['./**/*.{ts,tsx,json}', '!./**/*.test.*', '!./**/*fixtures*', '!./**/*fixtures*/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** The only file allowed to paint with the signal (lava) color. */
const SIGNAL_FILE = 'shared/PointsProgress.tsx'
/** The only file allowed to render <PointsProgress tone="signal">. */
const SIGNAL_TONE_FILE = 'shared/LevelCard.tsx'

const DASHES = /[\u2012\u2013\u2014\u2015]/u
const SIGNAL_CLASS =
  /(?<![\w-])(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|shadow|accent|caret|divide)-signal(?:-ink)?(?![\w-])/u
const FORBIDDEN = [
  'sconto',
  'sconti',
  'cashback',
  'estrazione',
  'estrazioni',
  'lotteria',
  'lotterie',
  'concorso a premi',
  'concorsi a premi',
  'classifica',
  'classifiche',
  'crypto',
  'nft',
  'formula 1',
  'f1',
]
/** A forbidden word is fine when the copy denies it: "nessuno sconto", "senza estrazioni". */
const NEGATION = /(?:^|[^\p{L}])(?:nessun|nessuno|nessuna|niente|senza|non|né)\s+(?:\p{L}+\s+)?$/iu

interface Literal {
  file: string
  line: number
  text: string
}

/** "./shared/LevelCard.tsx" -> "shared/LevelCard.tsx" */
function rel(file: string): string {
  return file.replace(/^\.\//, '')
}

function isModuleSpecifier(node: ts.Node): boolean {
  const parent = node.parent
  if (!parent) return false
  if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) return true
  if (ts.isExternalModuleReference(parent) || ts.isLiteralTypeNode(parent)) return true
  if (ts.isCallExpression(parent)) {
    const callee = parent.expression
    return callee.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(callee) && callee.text === 'require')
  }
  return false
}

/** String literals, template literal pieces and JSX text of a TS/TSX file. */
function tsLiterals(file: string, source: string): Literal[] {
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind)
  const out: Literal[] = []
  const push = (node: ts.Node, text: string) => {
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
    out.push({ file: rel(file), line, text })
  }
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!isModuleSpecifier(node)) push(node, node.text)
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      push(node, node.text)
    } else if (ts.isJsxText(node)) {
      if (node.text.trim()) push(node, node.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return out
}

/** True when the file renders a JSX attribute tone="signal" (or tone={'signal'}). */
function usesSignalTone(file: string, source: string): boolean {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let found = false
  const visit = (node: ts.Node) => {
    if (ts.isJsxAttribute(node) && node.name.getText(sf) === 'tone' && node.initializer) {
      const init = node.initializer
      const value = ts.isJsxExpression(init) ? init.expression : init
      if (value && (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) && value.text === 'signal') {
        found = true
      }
    }
    if (!found) ts.forEachChild(node, visit)
  }
  visit(sf)
  return found
}

/** Every string value (and key) of a JSON file. */
function jsonLiterals(file: string, source: string): Literal[] {
  const out: Literal[] = []
  const walk = (value: unknown) => {
    if (typeof value === 'string') out.push({ file: rel(file), line: 0, text: value })
    else if (Array.isArray(value)) value.forEach(walk)
    else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        out.push({ file: rel(file), line: 0, text: k })
        walk(v)
      }
    }
  }
  walk(JSON.parse(source))
  return out
}

const files = Object.keys(RAW).sort()
const sources = new Map(Object.entries(RAW))
const literals = files.flatMap((f) => {
  const src = sources.get(f) ?? ''
  return f.endsWith('.json') ? jsonLiterals(f, src) : tsLiterals(f, src)
})

function where(l: Literal): string {
  return l.line ? `${l.file}:${l.line}` : l.file
}

/** "app" as a word in copy, unless it is myAudi's app. Hyphens, slashes and dots keep it inside a token. */
export function mentionsApp(text: string): boolean {
  const cleaned = text.replace(/myAudi\s+app|app\s+myAudi/giu, ' ')
  return /(?<=^|[\s'’"(«])app(?=$|[\s,;:!?)'’"»]|\.(?:\s|$))/iu.test(cleaned)
}

/** Forbidden words used affirmatively (negated mentions such as "nessuno sconto" are allowed). */
export function forbiddenWords(text: string): string[] {
  const hits: string[] = []
  for (const word of FORBIDDEN) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${word.replace(/ /g, '\\s+')}(?![\\p{L}\\p{N}])`, 'giu')
    for (const m of text.matchAll(re)) {
      if (!NEGATION.test(text.slice(0, m.index))) hits.push(word)
    }
  }
  return hits
}

describe('compliance helpers', () => {
  it('flags the product called an app, but not myAudi', () => {
    expect(mentionsApp("Scarica l'app")).toBe(true)
    expect(mentionsApp('La nostra app.')).toBe(true)
    expect(mentionsApp("Nell'app myAudi trovi la tab")).toBe(false)
    expect(mentionsApp('La myAudi app ha una sezione')).toBe(false)
    expect(mentionsApp('app-shell flex')).toBe(false)
    expect(mentionsApp('applicazione webapp')).toBe(false)
  })

  it('flags forbidden mechanics unless negated', () => {
    expect(forbiddenWords('Vinci con la lotteria')).toEqual(['lotteria'])
    expect(forbiddenWords('Uno sconto del 10%')).toEqual(['sconto'])
    expect(forbiddenWords('Nessuno sconto e nessun credito in euro')).toEqual([])
    expect(forbiddenWords('nessuna estrazione, nessuna classifica')).toEqual([])
    expect(forbiddenWords('Come in F1')).toEqual(['f1'])
    expect(forbiddenWords('classificazione scontrino')).toEqual([])
  })
})

describe('compliance of src/features/audi-with-you', () => {
  it('finds the feature files', () => {
    expect(files.length).toBeGreaterThan(5)
    expect(files.some((f) => rel(f) === 'program.it.json')).toBe(true)
    expect(files.some((f) => /\.test\.|fixtures/.test(f))).toBe(false)
    // The checker itself works: LevelCard is the one place that renders the lava bar.
    expect(usesSignalTone(SIGNAL_TONE_FILE, sources.get(`./${SIGNAL_TONE_FILE}`) ?? '')).toBe(true)
  })

  it('has no em-dash or en-dash anywhere, comments included', () => {
    const offenders = files.flatMap((f) =>
      (sources.get(f) ?? '')
        .split('\n')
        .flatMap((line, i) => (DASHES.test(line) ? [`${rel(f)}:${i + 1}`] : [])),
    )
    expect(offenders).toEqual([])
  })

  it('never calls the product an "app" (only myAudi is an app)', () => {
    const offenders = literals.filter((l) => mentionsApp(l.text)).map((l) => `${where(l)} ${JSON.stringify(l.text)}`)
    expect(offenders).toEqual([])
  })

  it('has no discounts, cashback, draws, contests, rankings, crypto or Formula 1 in copy', () => {
    const offenders = literals.flatMap((l) => forbiddenWords(l.text).map((w) => `${where(l)} "${w}"`))
    expect(offenders).toEqual([])
  })

  it(`uses the signal color only in ${SIGNAL_FILE}`, () => {
    const offenders = literals
      .filter((l) => l.file !== SIGNAL_FILE && SIGNAL_CLASS.test(l.text))
      .map((l) => `${where(l)} ${JSON.stringify(l.text)}`)
    expect(offenders).toEqual([])
  })

  it(`renders tone="signal" only in ${SIGNAL_TONE_FILE}`, () => {
    const offenders = files
      .filter((f) => f.endsWith('.tsx') && rel(f) !== SIGNAL_TONE_FILE)
      .filter((f) => usesSignalTone(f, sources.get(f) ?? ''))
      .map(rel)
    expect(offenders).toEqual([])
  })
})
