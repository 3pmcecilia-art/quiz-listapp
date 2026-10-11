import { useState, useEffect } from 'react'
import TabBar from './components/TabBar.jsx'
import Tab1_SentenceNote from './components/Tab1_SentenceNote.jsx'
import Tab2_ProblemNote from './components/Tab2_ProblemNote.jsx'
import NoteModal from './components/NoteModal.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import { loadCards, addCard, updateCard, deleteCard } from './utils/db.js'
import { analyzeGrammar } from './utils/api.js'
import ToastContainer, { showToast } from './components/Toast.jsx'

function StatBadge({ label, count }) {
  return (
    <div className="flex items-center gap-1 text-xs bg-slate-100 px-2.5 py-1.5 rounded-full">
      <span className="text-slate-400">{label}</span>
      <span className="font-bold text-primary-600">{count}</span>
    </div>
  )
}

const MODAL_INIT   = { open: false, type: 'sentence', editingCard: null }
const CONFIRM_INIT = { open: false, id: null, type: null }

export default function App() {
  const [activeTab,    setActiveTab]    = useState('sentence')
  const [sentences,    setSentences]    = useState([])
  const [problems,     setProblems]     = useState([])
  const [modal,        setModal]        = useState(MODAL_INIT)
  const [confirm,      setConfirm]      = useState(CONFIRM_INIT)
  const [analyzingIds, setAnalyzingIds] = useState(new Set())
  const [loading,      setLoading]      = useState(true)
  const [dbError,      setDbError]      = useState(null)

  // 초기 데이터 로드
  useEffect(() => {
    async function fetchAll() {
      try {
        const [s, p] = await Promise.all([loadCards('sentence'), loadCards('problem')])
        setSentences(s)
        setProblems(p)
      } catch (err) {
        console.error(err)
        setDbError({
          message: '데이터를 불러오지 못했어요. Supabase 연결을 확인해주세요.',
          detail:  err?.message || String(err),
        })
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // ── 분석 트리거 ────────────────────────────────────────
  const triggerAnalysis = async (type, card) => {
    const setter = type === 'sentence' ? setSentences : setProblems
    setAnalyzingIds((ids) => new Set([...ids, card.id]))
    try {
      const result = await analyzeGrammar(type, card)
      setter((prev) => prev.map((c) => (c.id === card.id ? { ...c, grammarAnalysis: result } : c)))
      await updateCard(card.id, { grammarAnalysis: result })
    } catch {
      const errVal = { error: true }
      setter((prev) => prev.map((c) => (c.id === card.id ? { ...c, grammarAnalysis: errVal } : c)))
      await updateCard(card.id, { grammarAnalysis: errVal }).catch(() => {})
    } finally {
      setAnalyzingIds((ids) => { const s = new Set(ids); s.delete(card.id); return s })
    }
  }

  // ── 모달 ───────────────────────────────────────────────
  const openAdd    = (type) => setModal({ open: true, type, editingCard: null })
  const openEdit   = (type, card) => setModal({ open: true, type, editingCard: card })
  const closeModal = () => setModal(MODAL_INIT)

  // ── 저장 (추가 / 수정) ─────────────────────────────────
  const handleSave = async (formData) => {
    const { editingCard, type } = modal
    const setter = type === 'sentence' ? setSentences : setProblems

    if (editingCard) {
      const contentChanged = type === 'sentence'
        ? formData.sentence !== editingCard.sentence
        : formData.problem !== editingCard.problem || formData.answer !== editingCard.answer

      const updated = {
        ...editingCard,
        ...formData,
        ...(contentChanged && { grammarAnalysis: null }),
      }
      setter((prev) => prev.map((c) => (c.id === editingCard.id ? updated : c)))
      await updateCard(editingCard.id, { ...formData, ...(contentChanged && { grammarAnalysis: null }) })
      if (contentChanged) triggerAnalysis(type, updated)
      showToast('카드가 수정됐어요.')
    } else {
      const newCard = {
        id: Date.now().toString(),
        ...formData,
        grammarAnalysis: null,
        createdAt: new Date().toISOString(),
      }
      await addCard(type, newCard)
      setter((prev) => [newCard, ...prev])
      triggerAnalysis(type, newCard)
      showToast('카드가 저장됐어요! AI 분석 중...')
    }
    closeModal()
  }

  // ── 메모 인라인 수정 ────────────────────────────────────
  const handleMemoUpdate = async (type, cardId, memo) => {
    const setter = type === 'sentence' ? setSentences : setProblems
    setter((prev) => prev.map((c) => (c.id === cardId ? { ...c, memo } : c)))
    await updateCard(cardId, { memo })
  }

  // ── 재분석 ─────────────────────────────────────────────
  const handleReanalyze = (type, card) => {
    const setter = type === 'sentence' ? setSentences : setProblems
    setter((prev) => prev.map((c) => (c.id === card.id ? { ...c, grammarAnalysis: null } : c)))
    updateCard(card.id, { grammarAnalysis: null }).catch(console.error)
    triggerAnalysis(type, card)
  }

  // ── 삭제 ───────────────────────────────────────────────
  const requestDelete = (type, id) => setConfirm({ open: true, type, id })

  const handleDeleteConfirm = async () => {
    const { type, id } = confirm
    await deleteCard(id)
    if (type === 'sentence') setSentences((prev) => prev.filter((c) => c.id !== id))
    else                     setProblems ((prev) => prev.filter((c) => c.id !== id))
    setConfirm(CONFIRM_INIT)
    showToast('카드가 삭제됐어요.', 'info')
  }

  // ── 로딩 / 에러 화면 ───────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <span className="text-4xl">⚠️</span>
          <p className="mt-3 text-slate-600 font-medium">{dbError.message}</p>
          <p className="mt-2 text-xs text-slate-400 break-all">{dbError.detail}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm px-4 py-2 rounded-lg bg-primary-500 text-white"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 px-4 py-3.5 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-2xl">📚</span>
          <div>
            <h1 className="text-base md:text-lg font-bold text-slate-800 leading-tight">영어 오답노트</h1>
            <p className="text-xs text-slate-400 hidden sm:block">English Study Note</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <StatBadge label="문장" count={sentences.length} />
            <StatBadge label="문제" count={problems.length} />
          </div>
        </div>
      </header>

      {/* 탭바 */}
      <div className="bg-white sticky top-[57px] z-10 border-b border-slate-100">
        <div className="max-w-2xl mx-auto">
          <TabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={{ sentence: sentences.length, problem: problems.length }}
          />
        </div>
      </div>

      {/* 콘텐츠 */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 relative">
        {activeTab === 'sentence' && (
          <Tab1_SentenceNote
            cards={sentences}
            onAdd={() => openAdd('sentence')}
            onEdit={(card) => openEdit('sentence', card)}
            onDelete={(id) => requestDelete('sentence', id)}
            analyzingIds={analyzingIds}
            onReanalyze={(card) => handleReanalyze('sentence', card)}
            onMemoUpdate={(id, memo) => handleMemoUpdate('sentence', id, memo)}
          />
        )}
        {activeTab === 'problem' && (
          <Tab2_ProblemNote
            cards={problems}
            onAdd={() => openAdd('problem')}
            onEdit={(card) => openEdit('problem', card)}
            onDelete={(id) => requestDelete('problem', id)}
            analyzingIds={analyzingIds}
            onReanalyze={(card) => handleReanalyze('problem', card)}
            onMemoUpdate={(id, memo) => handleMemoUpdate('problem', id, memo)}
          />
        )}
      </main>

      <NoteModal
        isOpen={modal.open}
        onClose={closeModal}
        onSave={handleSave}
        type={modal.type}
        editingCard={modal.editingCard}
      />

      <ConfirmDialog
        isOpen={confirm.open}
        message="이 카드를 삭제할까요?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirm(CONFIRM_INIT)}
      />

      <ToastContainer />
    </div>
  )
}
