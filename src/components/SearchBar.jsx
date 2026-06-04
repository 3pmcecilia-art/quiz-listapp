export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative mb-3">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
        🔍
      </span>
      <label htmlFor="search-input" className="sr-only">{placeholder}</label>
      <input
        id="search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-12 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition placeholder:text-slate-300"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="검색어 지우기"
          className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  )
}
