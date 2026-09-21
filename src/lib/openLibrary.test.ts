import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { OpenLibraryDoc } from './openLibrary'
import { looksLikeIsbn, searchOpenLibrary } from './openLibrary'

function doc(overrides: Partial<OpenLibraryDoc>): OpenLibraryDoc {
  return {
    key: `/works/OL1W`,
    title: 'Dune',
    author_name: ['Frank Herbert'],
    subject: ['Fiction'],
    first_sentence: ['A beginning is the time for taking the most delicate care.'],
    language: ['eng'],
    ...overrides,
  }
}

function fetchOk(url: string): Response {
  const docs: OpenLibraryDoc[] = [
    doc({ key: '/works/OL1W', title: 'Dune' }),
    doc({ key: '/works/OL2W', title: 'Dune Messiah' }),
  ]
  if (url.includes('search.json')) {
    return new Response(JSON.stringify({ docs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return new Response(JSON.stringify({ description: 'A work description.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchMock: typeof fetch = (_input, _init) =>
  Promise.resolve(fetchOk(String(_input)))

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('looksLikeIsbn', () => {
  it('detects 10- and 13-digit ISBNs with dashes or spaces', () => {
    expect(looksLikeIsbn('9780140328721')).toBe(true)
    expect(looksLikeIsbn('978 0140 3287 21')).toBe(true)
    expect(looksLikeIsbn('0-306-40615-2')).toBe(true)
    expect(looksLikeIsbn('dune')).toBe(false)
    expect(looksLikeIsbn('97801403287210')).toBe(false)
  })
})

describe('searchOpenLibrary', () => {
  it('returns an empty list for a blank query without calling the API', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    await expect(searchOpenLibrary('   ')).resolves.toEqual([])
    expect(spy).not.toHaveBeenCalled()
  })

  it('routes ISBN queries to the exact isbn: field', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    await searchOpenLibrary('978 0140 3287 21')
    const url = String(spy.mock.calls[0]?.[0])
    expect(url).toContain('search.json')
    expect(url).toContain('q=isbn%3A9780140328721')
  })

  it('routes title queries to the general search without an exact title field', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    await searchOpenLibrary('Dune')
    const url = String(spy.mock.calls[0]?.[0])
    expect(url).toContain('q=Dune')
    expect(url).not.toContain('title%3A')
  })

  it('returns only English-language editions', async () => {
    const res = new Response(
      JSON.stringify({
        docs: [
          doc({ key: '/works/OL1W', language: ['eng'] }),
          doc({ key: '/works/OL2W', language: ['fre'] }),
          doc({ key: '/works/OL3W', language: [] }),
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
    vi.stubGlobal('fetch', () => Promise.resolve(res))

    const books = await searchOpenLibrary('dune')
    expect(books.map((b) => b.book_api_id)).toEqual(['OL1W'])
  })

  it('filters catalog noise from subjects', async () => {
    const res = new Response(
      JSON.stringify({
        docs: [
          doc({
            key: '/works/OL1W',
            subject: ['Fiction', 'in library', 'accessible book', 'Література'],
          }),
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
    vi.stubGlobal('fetch', () => Promise.resolve(res))

    const books = await searchOpenLibrary('dune')
    expect(books[0]?.subjects).toEqual(['Fiction'])
  })

  it('collapses duplicate works into a single row', async () => {
    const res = new Response(
      JSON.stringify({
        docs: [
          doc({ key: '/works/OL1W', title: 'Dune' }),
          doc({ key: '/works/OL1W', title: 'Dune (deluxe)' }),
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
    vi.stubGlobal('fetch', () => Promise.resolve(res))

    const books = await searchOpenLibrary('dune')
    expect(books).toHaveLength(1)
    expect(books[0]?.book_api_id).toBe('OL1W')
  })

  it('caps the result set at six preview rows', async () => {
    const docs = Array.from({ length: 8 }, (_, i) =>
      doc({ key: `/works/OL${i}W`, title: `Dune ${i}` }),
    )
    const res = new Response(JSON.stringify({ docs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
    vi.stubGlobal('fetch', () => Promise.resolve(res))

    const books = await searchOpenLibrary('dune')
    expect(books).toHaveLength(6)
  })

  it('falls back to the work description when there is no first sentence', async () => {
    const res = new Response(
      JSON.stringify({
        docs: [doc({ key: '/works/OL1W', first_sentence: undefined })],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
    vi.stubGlobal('fetch', (_input: string) => {
      if (_input.includes('search.json')) return Promise.resolve(res)
      return Promise.resolve(
        new Response(JSON.stringify({ description: 'A work description.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    })

    const books = await searchOpenLibrary('dune')
    expect(books[0]?.synopsis).toBe('A work description.')
  })

  it('keeps the first sentence synopsis without fetching the work', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    await searchOpenLibrary('dune')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('requests the cover id in the search fields', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    await searchOpenLibrary('Dune')
    const url = String(spy.mock.calls[0]?.[0])
    expect(url).toContain('cover_i')
  })

  it('carries the cover id into preview rows', async () => {
    const res = new Response(
      JSON.stringify({
        docs: [doc({ key: '/works/OL1W', cover_i: 1234 })],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
    vi.stubGlobal('fetch', (_input: string) =>
      Promise.resolve(
        _input.includes('search.json')
          ? res
          : new Response(JSON.stringify({ description: '' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
      ),
    )

    const books = await searchOpenLibrary('dune')
    expect(books[0]?.cover_i).toBe(1234)
  })

  it('throws when the Open Library request fails', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 500 })))
    await expect(searchOpenLibrary('dune')).rejects.toThrow(
      'Open Library request failed',
    )
  })
})