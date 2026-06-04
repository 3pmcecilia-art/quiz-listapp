import { useState, useEffect, useRef } from 'react'
import { extractTextFromImage } from '../utils/api.js'

const MODES = { IMAGE: 'image', TEXT: 'text' }
const FOCUSABLE_SEL = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled])'

const initForm = (type) =>
  type === 'sentence'
    ? { sentence: '', memo: '' }
    : { problem: '', answer: '', memo: '' }

export default function NoteModal({ isOpen, onClose, onSave, type, editingCard }) {
  const [inputMode, setInputMode] = useState(MODES.TEXT)
  const [form, setForm]           = useState(initForm(type))
  const [imgPreview, setImgPreview] = useState(null)
  const [isOcrLoading, setIsOcrLoading] = useState(false)
  const [ocrError, setOcrError]   = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileRef    = useRef(null)
  const firstField = useRef(null)
  const dialogRef  = useRef(null)

  // 폼 초기화
  useEffect(() => {
    if (!isOpen) return
    setInputMode(MODES.TEXT)
    setImgPreview(null)
    setOcrError(null)
    setShowPreview(false)
    if (editingCard) {
      if (type === 'sentence') {
        setForm({ sentence: editingCard.sentence, memo: editingCard.memo || '' })
      } else {
        setForm({ problem: editingCard.problem, answer: editingCard.answer || '', memo: editingCard.memo || '' })
      }
    } else {
      setForm(initForm(type))
    }
  }, [isOpen, editingCard, type])

  // 자동 포커스
  useEffect(() => {
    if (isOpen) setTimeout(() => firstField.current?.focus(), 80)
  }, [isOpen])

  // ESC 닫기
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // 포커스 트랩
  useEffect(() => {
    if (!isOpen) return
    const el = dialogRef.current
    if (!el) return
    const trap = (e) => {
      if (e.key !== 'Tab') return
      const nodes = [...el.querySelectorAll(FOCUSABLE_SEL)]
      if (!nodes.length) return
      const first = nodes[0]
      const last  = nodes[nodes.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus() }
      }
    }
    el.addEventListener('keydown', trap)
    return () => el.removeEventListener('keydown', trap)
  }, [isOpen])

  if (!isOpen) return null

  const isEdit = !!editingCard
  const mainText = type === 'sentence' ? (form.sentence || '') : (form.problem || '')
  const isValid = type === 'sentence'
    ? (form.sentence || '').trim().length > 0
    : (form.problem || '').trim().length > 0 && (form.answer || '').trim().length > 0

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    processImageFile(file)
    e.target.value = ''
  }

  const processImageFile = async (file) => {
    setImgPreview(URL.createObjectURL(file))
    setOcrError(null)
    setIsOcrLoading(true)
    try {
      const text = await extractTextFromImage(file)
      setForm((f) =>
        type === 'sentence' ? { ...f, sentence: text } : { ...f, problem: text }
      )
    } catch {
      setOcrError('텍스트 인식에 실패했어요. 직접 수정해주세요.')
    } finally {
      setIsOcrLoading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) processImageFile(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h2 id="modal-title" className="text-lg font-bold text-slate-800">
            {isEdit ? '카드 수정' : type === 'sentence' ? '문장 추가' : '문제 추가'}
          </h2>
          <button
            onClick={onClose}
            aria-label="모달 닫기"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 text-base transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 입력 방식 탭 (수정 시 숨김) */}
        {!isEdit && (
          <div
            role="tablist"
            aria-label="입력 방식 선택"
            className="flex mx-6 mb-4 rounded-xl bg-slate-100 p-1 shrink-0"
          >
            {[
              { id: MODES.IMAGE, icon: '📷', label: '이미지 업로드' },
              { id: MODES.TEXT,  icon: '⌨️', label: '직접 입력'    },
            ].map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={inputMode === m.id}
                onClick={() => { setInputMode(m.id); setOcrError(null) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputMode === m.id
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>{m.icon}</span><span>{m.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* 스크롤 영역 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 pb-6 overflow-y-auto flex-1">

          {/* 이미지 업로드 영역 */}
          {inputMode === MODES.IMAGE && !isEdit && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`w-full rounded-2xl border-2 border-dashed transition-colors overflow-hidden
                  ${imgPreview ? 'border-primary-300' : 'border-slate-200 hover:border-primary-300'}`}
              >
                {imgPreview ? (
                  <div className="relative">
                    <img src={imgPreview} alt="업로드 이미지" className="w-full max-h-44 object-contain bg-slate-50" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm font-medium">다시 선택</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                    <span className="text-4xl">📷</span>
                    <p className="text-sm font-medium">클릭하거나 이미지를 드래그하여 업로드</p>
                    <p className="text-xs">카메라 촬영 또는 갤러리에서 선택</p>
                  </div>
                )}
              </button>

              {/* OCR 상태 */}
              {isOcrLoading && (
                <div className="flex items-center gap-2 mt-2 text-primary-600 text-sm">
                  <span className="inline-block w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                  텍스트 인식 중...
                </div>
              )}
              {ocrError && (
                <p className="mt-2 text-red-500 text-xs">{ocrError}</p>
              )}
              {imgPreview && !isOcrLoading && !ocrError && mainText && (
                <p className="mt-2 text-green-600 text-xs">✓ 텍스트 인식 완료. 아래에서 수정하세요.</p>
              )}
            </div>
          )}

          {/* 폼 필드 */}
          {type === 'sentence' ? (
            <>
              <Textarea
                inputRef={firstField}
                label="문장 *"
                value={form.sentence || ''}
                onChange={set('sentence')}
                placeholder="영어 문장을 입력하세요"
                rows={3}
              />
              <Textarea
                label="메모"
                value={form.memo || ''}
                onChange={set('memo')}
                placeholder="문법 포인트, 해석 등 메모를 입력하세요 (선택)"
                rows={2}
              />
            </>
          ) : (
            <>
              <Textarea
                inputRef={firstField}
                label="문제 *"
                value={form.problem || ''}
                onChange={set('problem')}
                placeholder="문제를 입력하세요"
                rows={3}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="answer-input">정답 *</label>
                <input
                  id="answer-input"
                  type="text"
                  value={form.answer || ''}
                  onChange={set('answer')}
                  placeholder="정답을 입력하세요"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
                />
              </div>
              <Textarea
                label="틀린 이유 메모"
                value={form.memo || ''}
                onChange={set('memo')}
                placeholder="왜 틀렸는지 이유를 적어보세요 (선택)"
                rows={2}
              />
            </>
          )}

          {/* 미리보기 토글 */}
          {mainText.trim() && (
            <div>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                aria-expanded={showPreview}
                className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:underline"
              >
                <span>{showPreview ? '▾' : '▸'}</span>
                미리보기
              </button>
              {showPreview && (
                <div className="mt-3 rounded-2xl border border-primary-100 bg-primary-50 p-4 text-sm">
                  <p className="text-xs text-primary-400 font-medium mb-2 uppercase tracking-wide">카드 미리보기</p>
                  {type === 'sentence' ? (
                    <>
                      <p className="font-semibold text-slate-800 leading-snug">{form.sentence}</p>
                      {form.memo && <p className="mt-1.5 text-slate-500 text-sm">{form.memo}</p>}
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-700 leading-snug">{form.problem}</p>
                      {form.answer && (
                        <div className="mt-2 bg-white rounded-lg px-3 py-1.5 border border-primary-100">
                          <p className="text-xs text-slate-400">정답</p>
                          <p className="text-slate-700">{form.answer}</p>
                        </div>
                      )}
                      {form.memo && <p className="mt-1.5 text-slate-500 text-xs">{form.memo}</p>}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!isValid || isOcrLoading}
              className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isEdit ? '수정 완료' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, rows, inputRef }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <textarea
        ref={inputRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
      />
    </div>
  )
}
