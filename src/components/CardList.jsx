import NoteCard from './NoteCard.jsx'
import EmptyState from './EmptyState.jsx'

export default function CardList({ cards, type, onEdit, onDelete, analyzingIds, onReanalyze, onMemoUpdate, emptySearchQuery, onClearSearch }) {
  if (cards.length === 0) {
    if (emptySearchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-slate-500 font-medium">검색 결과가 없어요.</p>
          <p className="text-slate-400 text-sm">
            "<span className="font-medium text-slate-600">{emptySearchQuery}</span>"와 일치하는 카드가 없습니다.
          </p>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="mt-1 px-4 py-2 text-sm text-primary-600 border border-primary-200 rounded-full hover:bg-primary-50 transition-colors"
            >
              검색 초기화
            </button>
          )}
        </div>
      )
    }
    return <EmptyState type={type} />
  }

  return (
    <div className="flex flex-col gap-3 pb-32">
      {cards.map((card) => (
        <NoteCard
          key={card.id}
          card={card}
          type={type}
          onEdit={onEdit}
          onDelete={onDelete}
          isAnalyzing={analyzingIds.has(card.id)}
          onReanalyze={onReanalyze}
          onMemoUpdate={onMemoUpdate}
        />
      ))}
    </div>
  )
}
