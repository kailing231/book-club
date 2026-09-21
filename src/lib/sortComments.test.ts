import type { Comment } from './types'
import { sortComments } from './sortComments'

function comment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'c1',
    book_id: 'b1',
    user_id: 'u1',
    updated_by: 'u1',
    text: 'text',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('sortComments', () => {
  it('sorts comments oldest-first by creation time', () => {
    const newer = comment({ id: 'c1', created_at: '2026-03-01T00:00:00Z' })
    const middle = comment({ id: 'c2', created_at: '2026-02-01T00:00:00Z' })
    const older = comment({ id: 'c3', created_at: '2026-01-01T00:00:00Z' })

    expect(sortComments([newer, middle, older]).map((c) => c.id)).toEqual([
      'c3',
      'c2',
      'c1',
    ])
  })

  it('breaks same-instant ties by id ascending', () => {
    const a = comment({ id: 'c-a', created_at: '2026-01-01T00:00:00Z' })
    const b = comment({ id: 'c-b', created_at: '2026-01-01T00:00:00Z' })
    const c = comment({ id: 'c-c', created_at: '2026-01-01T00:00:00Z' })

    expect(sortComments([c, a, b]).map((cm) => cm.id)).toEqual(['c-a', 'c-b', 'c-c'])
  })

  it('does not mutate the input array', () => {
    const comments = [
      comment({ id: 'c1', created_at: '2026-02-01T00:00:00Z' }),
      comment({ id: 'c2', created_at: '2026-01-01T00:00:00Z' }),
    ]

    sortComments(comments)

    expect(comments.map((c) => c.id)).toEqual(['c1', 'c2'])
  })

  it('returns an empty array for empty input', () => {
    expect(sortComments([])).toEqual([])
  })
})