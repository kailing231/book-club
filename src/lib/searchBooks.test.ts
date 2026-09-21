import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UI_TEXT } from './uiText'
import { searchBooks } from './searchBooks'
import type { PreviewBook } from './types'

vi.mock('./openLibrary', () => ({
  searchOpenLibrary: vi.fn(),
}))

import { searchOpenLibrary as mockOpenLibrary } from './openLibrary'

const mockedOpenLibrary = vi.mocked(mockOpenLibrary)

function preview(id: string, title = `Book ${id}`): PreviewBook {
  return { book_api_id: id, title, authors: [], subjects: [], synopsis: '' }
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  mockedOpenLibrary.mockResolvedValue([])
})

describe('searchBooks', () => {
  it('returns an empty list for a blank query without calling the provider', async () => {
    await expect(searchBooks('   ')).resolves.toEqual([])
    expect(mockedOpenLibrary).not.toHaveBeenCalled()
  })

  it('returns Open Library results', async () => {
    const books = [preview('ol1', 'Dune')]
    mockedOpenLibrary.mockResolvedValue(books)
    await expect(searchBooks('dune')).resolves.toEqual(books)
  })

  it('serves repeated, case-variant queries from cache without calling the provider', async () => {
    const books = [preview('ol1', 'Dune')]
    mockedOpenLibrary.mockResolvedValue(books)

    await searchBooks('Dune')
    await expect(searchBooks('dune')).resolves.toEqual(books)

    expect(mockedOpenLibrary).toHaveBeenCalledTimes(1)
  })

  it('refetches from the provider once the cache entry has expired', async () => {
    vi.useFakeTimers()
    const books = [preview('ol1', 'Dune')]
    mockedOpenLibrary.mockResolvedValue(books)
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

    await searchBooks('dune')
    vi.setSystemTime(new Date('2026-01-01T02:00:00Z'))
    await searchBooks('dune')

    expect(mockedOpenLibrary).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('throws the user-facing message when Open Library fails', async () => {
    mockedOpenLibrary.mockRejectedValue(new Error('network'))

    await expect(searchBooks('dune')).rejects.toThrow(UI_TEXT.addBooks.searchFailed)
  })
})