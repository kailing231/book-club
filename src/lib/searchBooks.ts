import type { PreviewBook } from './types'
import { searchOpenLibrary } from './openLibrary'
import { UI_TEXT } from './uiText'

const CACHE_KEY = 'bookclub.search.cache.v4'
const CACHE_TTL_MS = 60 * 60 * 1000

interface CacheEntry {
  t: number
  books: PreviewBook[]
}

function readCache(): Record<string, CacheEntry> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, CacheEntry>
  } catch {
    return {}
  }
}

function writeCache(query: string, books: PreviewBook[]) {
  try {
    const cache = readCache()
    cache[query] = { t: Date.now(), books }
    // Prune stale entries and keep the cache small.
    for (const key of Object.keys(cache)) {
      if (Date.now() - cache[key].t > CACHE_TTL_MS) delete cache[key]
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage unavailable (private mode, quota) - cache is optional.
  }
}

function readCached(query: string): PreviewBook[] | null {
  const cache = readCache()
  const entry = cache[query]
  if (!entry) return null
  if (Date.now() - entry.t > CACHE_TTL_MS) return null
  return entry.books
}

export async function searchBooks(query: string): Promise<PreviewBook[]> {
  const key = query.trim().toLowerCase()
  if (!key) return []

  const cached = readCached(key)
  if (cached) return cached

  try {
    const books = await searchOpenLibrary(query)
    writeCache(key, books)
    return books
  } catch {
    throw new Error(UI_TEXT.addBooks.searchFailed)
  }
}