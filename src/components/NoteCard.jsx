import { useState, useRef, useEffect } from 'react'
import { relativeDate } from '../utils/date.js'

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')

export default function NoteCard({ card, type, onEdit, onDelete, isAnalyzing, onReanalyze, onMemoUpdate }) {
  const dateStr = relativeDate(card.createdAt)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 flex flex-col gap-3">
        {type === 'sentence' ? <SentenceContent card={card} /> : <ProblemContent card={card} />}
        <InlineMemo value={card.memo} onSave={(text) => onMemoUpdate(card.id, text)} />
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <time dateTime={card.createdAt} className="text-xs text-slate-400">{dateStr}</time>
          <div className="flex gap-1">
            <ActionBtn onClick={() => onEdit(card)}      label="수정" variant="blue" />
            <ActionBtn onClick={() => onDelete(card.id)} label="삭제" variant="red"  />
          </div>
        </div>
      </div>
      <AnalysisSection
        analysis={card.grammarAnalysis}
        type={type}
        isAnalyzing={isAnalyzing}
        onReanalyze={() => onReanalyze(card)}
      />
    </div>
  )
}

function SentenceContent({ card }) {
  return <p className="text-base font-semibold text-slate-800 leading-snug break-words">{card.sentence}</p>
}

function ProblemContent({ card }) {
  return (
    <>
      <p className="text-sm font-semibold text-slate-700 leading-snug break-words">{card.problem}</p>
      <div className="bg-slate-50 rounded-xl px-3 py-2.5">
        <p className="text-xs text-slate-400 mb-0.5">정답</p>
        <p className="text-sm text-slate-700 break-words">{card.answer}</p>
      </div>
    </>
  )
}

function InlineMemo({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value || '')
  const textareaRef = useRef(null)

  useEffect(() => { setText(value || '') }, [value])
  useEffect(() => { if (editing) textareaRef.current?.focus() }, [editing])

  const commit = () => {
    setEditing(false)
    const trimmed = text.trim()
    if (trimmed !== (value || '').trim()) onSave(trimmed)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setText(value || ''); setEditing(false) }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit()
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder={`메모를 입력하세요... (${isMac ? 'Cmd' : 'Ctrl'}+Enter: 저장, Esc: 취소)`}
          className="w-full text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 resize-none outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full min-h-[44px] text-left rounded-xl px-3 py-2 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center gap-2 group"
    >
      <span className="text-base opacity-40 group-hover:opacity-60">✏️</span>
      {value
        ? <span className="text-sm text-slate-500 break-words">{value}</span>
        : <span className="text-sm text-slate-300 italic">메모 추가...</span>
      }
    </button>
  )
}

function AnalysisSection({ analysis, type, isAnalyzing, onReanalyze }) {
  if (isAnalyzing) {
    return (
      <div className="px-4 py-3.5 bg-primary-50 border-t border-primary-100 flex items-center gap-2.5">
        <span className="inline-block w-4 h-4 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin shrink-0" />
        <span className="text-xs text-primary-600 font-medium">AI 문법 분석 중...</span>
      </div>
    )
  }
  if (analysis?.error) {
    return (
      <div className="px-4 py-3.5 bg-red-50 border-t border-red-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span className="text-xs text-red-500 font-medium">분석에 실패했어요.</span>
        </div>
        <button onClick={onReanalyze} className="min-h-[44px] px-3 text-xs text-primary-600 font-semibold hover:underline flex items-center">
          다시 분석하기
        </button>
      </div>
    )
  }
  if (!analysis) return null
  return <AnalysisResult analysis={analysis} type={type} />
}

function AnalysisResult({ analysis, type }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-t border-primary-100 bg-primary-50">
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full min-h-[44px] flex items-center justify-between px-4 py-2.5 hover:bg-primary-100 active:bg-primary-200 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">📊</span>
          <span className="text-xs font-semibold text-primary-700 shrink-0">AI 문법 분석</span>
          {(analysis.grammarPointKo || analysis.grammarPoint) && (
            <span className="text-xs text-primary-600 bg-white border border-primary-200 px-2 py-0.5 rounded-full truncate max-w-[140px]">
              {analysis.grammarPointKo || analysis.grammarPoint}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-primary-600 shrink-0 ml-2">
          {expanded ? '접기 ▲' : '분석 보기 ▼'}
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-5 flex flex-col gap-4">
          <div>
            <SectionLabel icon="🔖" label="문법 포인트" />
            <p className="mt-1 text-sm text-slate-800 font-medium">
              {analysis.grammarPointKo}
              {analysis.grammarPoint && (
                <span className="text-slate-400 text-xs font-normal ml-1.5">({analysis.grammarPoint})</span>
              )}
            </p>
          </div>
          {analysis.explanation && (
            <div>
              <SectionLabel icon="📖" label="설명" />
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{analysis.explanation}</p>
            </div>
          )}
          {type === 'sentence' && analysis.examples?.length > 0 && (
            <div>
              <SectionLabel icon="✏️" label="예문" />
              <div className="mt-1.5 flex flex-col gap-2.5">
                {analysis.examples.map((ex, i) => (
                  <div key={i} className="text-xs">
                    <p className="font-medium text-slate-700 break-words">{i + 1}. {ex.sentence}</p>
                    <p className="text-slate-400 ml-3 mt-0.5">{ex.translation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {type === 'problem' && analysis.similarProblems?.length > 0 && (
            <div>
              <SectionLabel icon="✏️" label="유사 문제" />
              <div className="mt-1.5 flex flex-col gap-3">
                {analysis.similarProblems.map((sp, i) => (
                  <div key={i} className="text-xs">
                    <p className="font-medium text-slate-700 break-words">{i + 1}. {sp.question}</p>
                    <p className="text-primary-600 ml-3 mt-0.5">정답: {sp.answer}</p>
                    {sp.explanation && <p className="text-slate-400 ml-3 mt-0.5">{sp.explanation}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ icon, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{icon}</span>
      <span className="text-xs font-semibold text-primary-700">{label}</span>
    </div>
  )
}

function ActionBtn({ onClick, label, variant }) {
  const cls = variant === 'blue'
    ? 'text-primary-500 hover:bg-primary-50 active:bg-primary-100'
    : 'text-red-400 hover:bg-red-50 active:bg-red-100'
  return (
    <button onClick={onClick} className={`min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-medium px-3 rounded-xl transition-colors ${cls}`}>
      {label}
    </button>
  )
}
