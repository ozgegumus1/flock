import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: number
    message: string
    type: ToastType
}

const ToastContext = createContext<any>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now()
        setToasts((prev) => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3500)
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center px-4 w-full max-w-sm">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border text-sm font-medium animate-toast-in ${
                            toast.type === 'success'
                                ? 'bg-green-950/90 border-green-800 text-green-200'
                                : toast.type === 'error'
                                ? 'bg-red-950/90 border-red-800 text-red-200'
                                : 'bg-gray-900/90 border-gray-700 text-white'
                        }`}
                    >
                        {toast.type === 'success' && <CheckCircle size={18} className="shrink-0" />}
                        {toast.type === 'error' && <XCircle size={18} className="shrink-0" />}
                        {toast.type === 'info' && <Info size={18} className="shrink-0" />}
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    return useContext(ToastContext)
}