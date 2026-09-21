import type { BookRow } from './types'

export interface BookStats {
  recommended: number
  read: number
  percentRecommended: number
  voters: number
}

export function bookStats(book: BookRow, totalUsers: number): BookStats {
  const recommended = book.votes.filter((v) => v.recommended).length
  const read = book.votes.filter((v) => v.read).length
  const voters = book.votes.length
  const percentRecommended =
    totalUsers === 0 ? 0 : Math.round((recommended / totalUsers) * 100)
  return { recommended, read, percentRecommended, voters }
}