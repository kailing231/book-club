import type { PreviewBook } from './types'
import { isEnglishSubject } from './validation'

export interface OpenLibraryDoc {
  key: string
  title?: string
  author_name?: string[]
  subject?: string[]
  first_sentence?: string[]
  cover_i?: number
  language?: string[]
}

interface OpenLibrarySearchResponse {
  docs?: OpenLibraryDoc[]
}

interface OpenLibraryWork {
  description?: string | { value: string }
}

const SEARCH_URL = 'https://openlibrary.org/search.json'

const ISBN_RE = /^[\dXx]{10}$|^[\dXx]{13}$/

export function looksLikeIsbn(query: string): boolean {
  return ISBN_RE.test(query.replace(/[- ]/g, ''))
}

// Open Library subjects contain a lot of catalog noise; ignore obvious junk.
const NOISE_SUBJECTS = new Set([
  'accessible book',
  'in library',
  'protected daisy',
  'large print',
  'internet archive wishlist',
  'lending library',
  'openlibrary',
  'library of things',
])

function cleanSubjects(subjects: string[] | undefined): string[] {
  if (!subjects) return []
  return subjects
    .filter((s) => !NOISE_SUBJECTS.has(s.toLowerCase()))
    .filter(isEnglishSubject)
    .slice(0, 8)
}

async function fetchWorkDescription(key: string): Promise<string> {
  try {
    const res = await fetch(`https://openlibrary.org${key}.json`)
    if (!res.ok) return ''
    const work = (await res.json()) as OpenLibraryWork
    if (typeof work.description === 'string') return work.description
    return work.description?.value ?? ''
  } catch {
    return ''
  }
}

function toPreview(doc: OpenLibraryDoc, description: string): PreviewBook | null {
  const title = doc.title?.trim()
  if (!title) return null
  return {
    book_api_id: doc.key.split('/').pop() ?? doc.key,
    title,
    authors: doc.author_name ?? [],
    subjects: cleanSubjects(doc.subject),
    synopsis: doc.first_sentence?.[0] ?? description,
    cover_i: doc.cover_i ?? null,
  }
}

function isPreview(book: PreviewBook | null): book is PreviewBook {
  return book !== null
}

export async function searchOpenLibrary(query: string): Promise<PreviewBook[]> {
  const clean = query.trim()
  if (!clean) return []

  const searchQuery = looksLikeIsbn(clean)
    ? `isbn:${clean.replace(/[- ]/g, '')}`
    : clean

  const url = `${SEARCH_URL}?q=${encodeURIComponent(searchQuery)}&limit=8&fields=key,title,author_name,subject,first_sentence,cover_i,language`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open Library request failed (${res.status})`)

  const data = (await res.json()) as OpenLibrarySearchResponse
  const docs = data.docs ?? []

  // Accept only English editions.
  const english = docs.filter((d) => (d.language ?? []).includes('eng'))
  const chosen = english.slice(0, 6)

  const previews = await Promise.all(
    chosen.map(async (doc) => {
      const needsWork = !(doc.first_sentence && doc.first_sentence.length > 0)
      const description = needsWork ? await fetchWorkDescription(doc.key) : ''
      return toPreview(doc, description)
    }),
  )

  const seen = new Set<string>()
  return previews.filter(isPreview).filter((p) => {
    if (seen.has(p.book_api_id)) return false
    seen.add(p.book_api_id)
    return true
  })
}