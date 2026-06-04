import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ isOpen, message, onConfirm, onCancel }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onCancel])

  // 열릴 때 취소 버튼에 포커스 (실수 삭제 방지)
  useEffect(() => {
    if (isOpen) setTimeout(() => cancelRef.current?.focus(), 50)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="relative bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <span className="text-3xl">🗑️</span>
          <p id="confirm-title" className="mt-3 text-slate-700 font-medium">{message}</p>
          <p id="confirm-desc" className="text-sm text-slate-400 mt-1">이 작업은 되돌릴 수 없어요.</p>
        </div>
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 min-h-[44px] rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
