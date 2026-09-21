// Username rule: 1-40 chars; letters, numbers, and emojis; spaces allowed
// between words, but no leading/trailing spaces.
const USERNAME_RE = /^(?=.{1,40}$)[\p{L}\p{N}\p{Emoji}]+(?: {1,2}[\p{L}\p{N}\p{Emoji}]+)*$/u

export function isValidUsername(name: string): boolean {
  return USERNAME_RE.test(name)
}

// Sanitization intentionally strips control chars from user input; matching
// them is the whole point, so the no-control-regex warning is expected here.
// eslint-disable-next-line eslint/no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
export function sanitizeText(input: string): string {
  return input.replace(CONTROL_RE, '').trim()
}

export const MAX_COMMENT_LENGTH = 500

export function isValidComment(text: string): boolean {
  return text.length >= 1 && text.length <= MAX_COMMENT_LENGTH
}

export function normalizeAuthors(authors: string[]): string[] {
  const seen = new Set<string>()
  return [...authors]
    .map((a) => a.trim())
    .filter((a) => a.length > 0)
    .filter((a) => {
      const key = a.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

// Subjects in non-Latin scripts (CJK, Cyrillic, Arabic, Greek, etc.) are never
// English; drop anything that isn't Latin letters/numbers/punctuation.
const ENGLISH_SUBJECT_RE = /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}]+$/u

export function isEnglishSubject(subject: string): boolean {
  return ENGLISH_SUBJECT_RE.test(subject)
}

export function normalizeSubjects(subjects: string[]): string[] {
  const seen = new Set<string>()
  return subjects
    .map((g) => g.trim())
    .filter((g) => g.length > 0)
    .filter(isEnglishSubject)
    .filter((g) => {
      const key = g.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}