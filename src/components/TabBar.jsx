const TABS = [
  { id: 'sentence', label: '문장 노트', icon: '📝' },
  { id: 'problem',  label: '문제 노트', icon: '❓' },
]

export default function TabBar({ activeTab, onTabChange, counts }) {
  return (
    <div className="flex border-b border-slate-200 bg-white">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        const count    = counts?.[tab.id] ?? 0
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold
              transition-colors duration-150 min-h-[48px]
              ${isActive
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={`
              text-xs px-1.5 py-0.5 rounded-full font-medium
              ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400'}
            `}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
