import { useState, useEffect } from 'react'

const ICONS = { success: '✓', error: '✕', info: 'ℹ' }
const COLORS = {
  success: 'bg-slate-800 text-white',
  error:   'bg-red-500 text-white',
  info:    'bg-primary-600 text-white',
}

const listeners = new Set()
export function showToast(message, type = 'success') {
  listeners.forEach((fn) => fn({ message, type, id: Date.now() }))
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 2500)
    }
    listeners.add(handler)
    return () => listeners.delete(handler)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium
            animate-[fadeSlideUp_0.2s_ease-out]
            ${COLORS[t.type]}
          `}
        >
          <span className="text-base leading-none">{ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
