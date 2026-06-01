import { useState, useEffect } from 'react'
import TabBar from './components/TabBar.jsx'
import Tab1_SentenceNote from './components/Tab1_SentenceNote.jsx'
import Tab2_ProblemNote from './components/Tab2_ProblemNote.jsx'
import NoteModal from './components/NoteModal.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import { load, save } from './utils/storage.js'
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
  const [activeTab, setActiveTab] = useState('sentence')
  const [sentences, setSentences] = useState(() => load('sentences', []))
  const [problems,  setProblems]  = useState(() => load('problems',  []))
  const [modal,     setModal]     = useState(MODAL_INIT)
  const [confirm,   setConfirm]   = useState(CONFIRM_INIT)
  const [analyzingIds, setAnalyzingIds] = useState(new Set())

  useEffect(() => { save('sentences', sentences) }, [sentences])
  useEffect(() => { save('problems',  problems)  }, [problems])

  const triggerAnalysis = async (type, card) => {
    const setter = type === 'sentence' ? setSentences : setProblems
    setAnalyzingIds((ids) => new Set([...ids, card.id]))
    try {
      const result = await analyzeGrammar(type, card)
      setter((prev) => prev.map((c) => (c.id === card.id ? { ...c, grammarAnalysis: result } : c)))
    } catch {
      setter((prev) => prev.map((c) => (c.id === card.id ? { ...c, grammarAnalysis: { error: true } } : c)))
    } finally {
      setAnalyzingIds((ids) => { const s = new Set(ids); s.delete(card.id); return s })
    }
  }

  const openAdd    = (type) => setModal({ open: true, type, editingCard: null })
  const openEdit   = (type, card) => setModal({ open: true, type, editingCard: card })
  const closeModal = () => setModal(MODAL_INIT)

  const handleSave = (formData) => {
    const { editingCard, type } = modal
    const setter = type === 'sentence' ? setSentences : setProblems
    if (editingCard) {
      const contentChanged = type === 'sentence'
        ? formData.sentence !== editingCard.sentence
        : formData.problem !== editingCard.problem || formData.answer !== editingCard.answer
      const updated = { ...editingCard, ...formData, ...(contentChanged && { grammarAnalysis: null }) }
      setter((prev) => prev.map((c) => (c.id === editingCard.id ? updated : c)))
      if (contentChanged) triggerAnalysis(type, updated)
      showToast('카드가 수정됐어요.')
    } else {
      const newCard = { id: Date.now().toString(), ...formData, grammarAnalysis: null, createdAt: new Date().toISOString() }
      setter((prev) => [newCard, ...prev])
      triggerAnalysis(type, newCard)
      showToast('카드가 저장됐어요! AI 분석 중...')
    }
    closeModal()
  }

  const handleMemoUpdate = (type, cardId, memo) => {
    const setter = type === 'sentence' ? setSentences : setProblems
    setter((prev) => prev.map((c) => (c.id === cardId ? { ...c, memo } : c)))
  }

  const handleReanalyze = (type, card) => {
    const setter = type === 'sentence' ? setSentences : setProblems
    setter((prev) => prev.map((c) => (c.id === card.id ? { ...c, grammarAnalysis: null } : c)))
    triggerAnalysis(type, card)
  }

  const requestDelete = (type, id) => setConfirm({ open: true, type, id })
  const handleDeleteConfirm = () => {
    const { type, id } = confirm
    if (type === 'sentence') setSentences((prev) => prev.filter((c) => c.id !== id))
    else                     setProblems ((prev) => prev.filter((c) => c.id !== id))
    setConfirm(CONFIRM_INIT)
    showToast('카드가 삭제됐어요.', 'info')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
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

      <div className="bg-white sticky top-[57px] z-10 border-b border-slate-100">
        <div className="max-w-2xl mx-auto">
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} counts={{ sentence: sentences.length, problem: problems.length }} />
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 relative">
        {activeTab === 'sentence' && (
          <Tab1_SentenceNote
            cards={sentences} onAdd={() => openAdd('sentence')} onEdit={(card) => openEdit('sentence', card)}
            onDelete={(id) => requestDelete('sentence', id)} analyzingIds={analyzingIds}
            onReanalyze={(card) => handleReanalyze('sentence', card)}
            onMemoUpdate={(id, memo) => handleMemoUpdate('sentence', id, memo)}
          />
        )}
        {activeTab === 'problem' && (
          <Tab2_ProblemNote
            cards={problems} onAdd={() => openAdd('problem')} onEdit={(card) => openEdit('problem', card)}
            onDelete={(id) => requestDelete('problem', id)} analyzingIds={analyzingIds}
            onReanalyze={(card) => handleReanalyze('problem', card)}
            onMemoUpdate={(id, memo) => handleMemoUpdate('problem', id, memo)}
          />
        )}
      </main>

      <NoteModal isOpen={modal.open} onClose={closeModal} onSave={handleSave} type={modal.type} editingCard={modal.editingCard} />
      <ConfirmDialog isOpen={confirm.open} message="이 카드를 삭제할까요?" onConfirm={handleDeleteConfirm} onCancel={() => setConfirm(CONFIRM_INIT)} />
      <ToastContainer />
    </div>
  )
}
