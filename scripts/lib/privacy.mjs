// Shared detectors for secrets and personal data.
// Used by the history logger (redact before writing) and the pre-commit scan (block before committing).

export const DETECTORS = [
  { id: "email", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, label: "[email]" },
  {
    id: "token",
    re: /\b(?:sk-[A-Za-z0-9_-]{16,}|sk-ant-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z_-]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/g,
    label: "[token]",
  },
  { id: "bearer", re: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/g, label: "Bearer [token]" },
  { id: "private-key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g, label: "[private-key]" },
  // Italian mobiles (3xx...), and landlines written with a separator or +39 (bare 0-prefixed
  // 11-digit strings are company VAT numbers, which are public).
  { id: "phone", re: /(?<![\w.,/])(?:\+39[\s.-]?)?(?:3\d{2}[\s.-]?\d{3}[\s.-]?\d{3,4}|0\d{1,3}[\s.-]\d{5,8}|(?<=\+39[\s.-]?)0\d{5,10})(?![\w.,/])/g, label: "[phone]" },
  { id: "iban", re: /\b[A-Z]{2}\d{2}[A-Z]\d{10}[0-9A-Z]{12}\b/g, label: "[iban]" },
  { id: "codice-fiscale", re: /\b[A-Z]{6}\d{2}[A-EHLMPR-T]\d{2}[A-Z]\d{3}[A-Z]\b/g, label: "[codice-fiscale]" },
];

// Addresses that are safe to commit (bots, no-reply, placeholders).
const EMAIL_ALLOW = [/@users\.noreply\.github\.com$/i, /^noreply@/i, /@example\.(com|org)$/i];

export function isAllowed(id, match) {
  return id === "email" && EMAIL_ALLOW.some((re) => re.test(match));
}

export function redact(text) {
  let out = text;
  for (const d of DETECTORS) {
    out = out.replace(d.re, (m) => (isAllowed(d.id, m) ? m : d.label));
  }
  return out;
}

export function findings(text) {
  const hits = [];
  for (const d of DETECTORS) {
    for (const m of text.matchAll(d.re)) {
      if (isAllowed(d.id, m[0])) continue;
      const line = text.slice(0, m.index).split("\n").length;
      hits.push({ id: d.id, line, sample: m[0].slice(0, 6) + "..." });
    }
  }
  return hits;
}
