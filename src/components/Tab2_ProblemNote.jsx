import { useState, useMemo } from 'react'
import CardList from './CardList.jsx'
import AddButton from './AddButton.jsx'
import SearchBar from './SearchBar.jsx'

export default function Tab2_ProblemNote({ cards, onAdd, onEdit, onDelete, analyzingIds, onReanalyze, onMemoUpdate }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return cards
    const q = query.toLowerCase()
    return cards.filter((c) =>
      c.problem.toLowerCase().includes(q) ||
      (c.answer || '').toLowerCase().includes(q) ||
      (c.memo || '').toLowerCase().includes(q)
    )
  }, [cards, query])

  return (
    <>
      <SearchBar value={query} onChange={setQuery} placeholder="문제, 정답, 메모로 검색..." />
      <CardList
        cards={filtered}
        type="problem"
        onEdit={onEdit}
        onDelete={onDelete}
        analyzingIds={analyzingIds}
        onReanalyze={onReanalyze}
        onMemoUpdate={onMemoUpdate}
        emptySearchQuery={query}
        onClearSearch={() => setQuery('')}
      />
      <AddButton onClick={onAdd} label="문제 추가" />
    </>
  )
}
