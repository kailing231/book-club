import {
  MAX_COMMENT_LENGTH,
  isEnglishSubject,
  isValidComment,
  isValidUsername,
  normalizeAuthors,
  normalizeSubjects,
  sanitizeText,
} from './validation'

describe('isValidUsername', () => {
  it('accepts single lowercase words', () => {
    expect(isValidUsername('alice')).toBe(true)
  })

  it('accepts letters, numbers, and emojis', () => {
    expect(isValidUsername('alice2bob')).toBe(true)
    expect(isValidUsername('alice😀bob')).toBe(true)
  })

  it('accepts words separated by one or two spaces', () => {
    expect(isValidUsername('alice bob')).toBe(true)
    expect(isValidUsername('alice  bob')).toBe(true)
  })

  it('rejects empty names', () => {
    expect(isValidUsername('')).toBe(false)
  })

  it('rejects leading or trailing whitespace', () => {
    expect(isValidUsername(' alice')).toBe(false)
    expect(isValidUsername('alice ')).toBe(false)
  })

  it('rejects runs of three or more spaces', () => {
    expect(isValidUsername('alice   bob')).toBe(false)
  })

  it('rejects names longer than 40 characters', () => {
    expect(isValidUsername('a'.repeat(41))).toBe(false)
    expect(isValidUsername('a'.repeat(40))).toBe(true)
  })
})

describe('sanitizeText', () => {
  it('strips control characters and trims surrounding whitespace', () => {
    expect(sanitizeText('  a\u0000b\u0007c  ')).toBe('abc')
  })

  it('returns an empty string for whitespace-only input', () => {
    expect(sanitizeText('   ')).toBe('')
  })
})

describe('isValidComment', () => {
  it('rejects empty comments', () => {
    expect(isValidComment('')).toBe(false)
  })

  it('accepts comments up to MAX_COMMENT_LENGTH', () => {
    expect(isValidComment('x')).toBe(true)
    expect(isValidComment('x'.repeat(MAX_COMMENT_LENGTH))).toBe(true)
  })

  it('rejects comments longer than MAX_COMMENT_LENGTH', () => {
    expect(isValidComment('x'.repeat(MAX_COMMENT_LENGTH + 1))).toBe(false)
  })
})

describe('normalizeAuthors', () => {
  it('trims, drops empties, dedups case-insensitively, and sorts', () => {
    expect(normalizeAuthors(['c', ' bob ', '', 'A', 'a', 'Bob'])).toEqual(['A', 'bob', 'c'])
  })
})

describe('isEnglishSubject', () => {
  it('accepts Latin-script subjects', () => {
    expect(isEnglishSubject('Science Fiction')).toBe(true)
    expect(isEnglishSubject('Comics')).toBe(true)
  })

  it('rejects non-Latin-script subjects', () => {
    expect(isEnglishSubject('Архитектура')).toBe(false)
    expect(isEnglishSubject('科幻小说')).toBe(false)
  })
})

describe('normalizeSubjects', () => {
  it('trims, drops non-English subjects, and dedups case-insensitively in order', () => {
    expect(normalizeSubjects([' Sci-Fi ', 'sci-fi', '科幻', 'Science'])).toEqual([
      'Sci-Fi',
      'Science',
    ])
  })
})