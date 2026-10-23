interface ConfirmModalProps {
    open: boolean
    title: string
    message?: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
    onConfirm: () => void
    onCancel: () => void
}

function ConfirmModal({
    open,
    title,
    message,
    confirmText = 'Evet',
    cancelText = 'Vazgeç',
    danger = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!open) return null

    return (
        <div
            className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center px-4"
            onClick={(e) => {
                e.stopPropagation()
                onCancel()
            }}
        >
            <div
                className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-ink font-bold text-lg">{title}</h3>

                {message && <p className="text-gray-400 text-sm mt-2">{message}</p>}

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 border border-gray-700 hover:bg-gray-800 text-ink font-bold rounded-full py-2.5 text-sm transition"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 text-ink font-bold rounded-full py-2.5 text-sm transition ${
                            danger ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal
