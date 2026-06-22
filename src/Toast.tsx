import { useState, useCallback, useRef, createContext, useContext } from 'react'

type ToastType = 'success' | 'error'
type Toast = { id: number; msg: string; type: ToastType }
type ShowFn = (msg: string, type?: ToastType) => void

const Ctx = createContext<ShowFn>(() => {})
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const show = useCallback<ShowFn>((msg, type = 'success') => {
    const id = ++nextId.current
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
