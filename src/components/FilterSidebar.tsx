import { useMemo, useState } from 'react'
import type { BookFilters } from '../lib/types'
import { UI_TEXT } from '../lib/uiText'

interface FilterSidebarProps {
  open: boolean
  allSubjects: string[]
  filters: BookFilters
  onChange: (filters: BookFilters) => void
  onClose: () => void
}

export function FilterSidebar({ open, allSubjects, filters, onChange, onClose }: FilterSidebarProps) {
  const [subjectSearch, setSubjectSearch] = useState('')

  const sortedSubjects = useMemo(() => {
    const q = subjectSearch.toLowerCase()
    return allSubjects
      .filter((g) => g.toLowerCase().includes(q))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }, [allSubjects, subjectSearch])

  if (!open) return null

  function setSubjectState(subject: string, state: 'reset' | 'include' | 'exclude') {
    const subjectInclude = filters.subjectInclude.filter((g) => g !== subject)
    const subjectExclude = filters.subjectExclude.filter((g) => g !== subject)
    if (state === 'include') subjectInclude.push(subject)
    if (state === 'exclude') subjectExclude.push(subject)
    onChange({ ...filters, subjectInclude, subjectExclude })
  }

  function resetAll() {
    onChange({ title: "", authors: "", subjectInclude: [], subjectExclude: [] })
  }

  return (
    <div className="filter-backdrop" onClick={onClose}>
      <aside
        className="filter-sidebar"
        aria-label={UI_TEXT.filter.sectionAria}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filter-header">
          <h3 className="filter-title">{UI_TEXT.list.filter}</h3>
          <div className="filter-header-actions">
            <button type="button" className="btn btn--small btn--secondary" onClick={resetAll}>
              {UI_TEXT.filter.resetAll}
            </button>
            <button type="button" className="btn btn--small btn--secondary" onClick={onClose}>
              {UI_TEXT.common.close}
            </button>
          </div>
        </div>

        <label className="filter-field">
          <span className="filter-label">{UI_TEXT.filter.titleLabel}</span>
          <input
            type="text"
            value={filters.title}
            placeholder={UI_TEXT.filter.titlePlaceholder}
            onChange={(e) => onChange({ ...filters, title: e.target.value })}
          />
        </label>

        <label className="filter-field">
          <span className="filter-label">{UI_TEXT.filter.authorLabel}</span>
          <input
            type="text"
            value={filters.authors}
            placeholder={UI_TEXT.filter.authorPlaceholder}
            onChange={(e) => onChange({ ...filters, authors: e.target.value })}
          />
        </label>

        <div className="filter-subjects">
          <span className="filter-label">{UI_TEXT.filter.subjectLabel}</span>
          <input
            type="text"
            value={subjectSearch}
            placeholder={UI_TEXT.filter.subjectPlaceholder}
            className="filter-subject-search"
            onChange={(e) => setSubjectSearch(e.target.value)}
          />
          <div className="subject-columns">
            {sortedSubjects.map((subject) => {
              const includeChecked = filters.subjectInclude.includes(subject)
              const excludeChecked = filters.subjectExclude.includes(subject)
              const activeState = includeChecked ? 'include' : excludeChecked ? 'exclude' : 'reset'
              const stateButtons = [
                {
                  state: 'reset' as const,
                  glyph: UI_TEXT.filter.subjectResetGlyph,
                  label: UI_TEXT.filter.subjectReset,
                },
                {
                  state: 'include' as const,
                  glyph: UI_TEXT.filter.subjectIncludeGlyph,
                  label: UI_TEXT.filter.subjectInclude,
                },
                {
                  state: 'exclude' as const,
                  glyph: UI_TEXT.filter.subjectExcludeGlyph,
                  label: UI_TEXT.filter.subjectExclude,
                },
              ]
              return (
                <div key={subject} className="subject-row">
                  <span className="subject-name">{subject}</span>
                  <div className="subject-states" role="radiogroup" aria-label={subject}>
                    {stateButtons.map((btn) => (
                      <button
                        key={btn.state}
                        type="button"
                        className={`subject-state subject-state--${btn.state}${activeState === btn.state ? ' is-active' : ''}`}
                        role="radio"
                        aria-checked={activeState === btn.state}
                        aria-label={`${btn.label}: ${subject}`}
                        title={`${btn.label}: ${subject}`}
                        onClick={() => setSubjectState(subject, btn.state)}
                      >
                        <span aria-hidden="true">{btn.glyph}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </aside>
    </div>
  )
}