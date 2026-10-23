import { useState } from 'react'
import { LayoutGrid, List, X } from 'lucide-react'
import { useViewMode } from '../context/ViewModeContext'

const HINT_KEY = 'flock-view-hint-seen'

function ViewToggle() {
    const { mode, setMode } = useViewMode()

    const [showHint, setShowHint] = useState(() => {
        try {
            return localStorage.getItem(HINT_KEY) !== '1'
        } catch {
            return false
        }
    })

    const dismissHint = () => {
        setShowHint(false)
        try {
            localStorage.setItem(HINT_KEY, '1')
        } catch {
            // önemli değil
        }
    }

    const choose = (next: 'list' | 'grid') => {
        setMode(next)
        dismissHint()
    }

    const base = 'flex items-center gap-1.5 text-sm font-medium rounded-full px-3.5 py-1.5 transition'

    return (
        <div className="relative shrink-0">
            <div className="flex items-center bg-gray-900 border border-gray-800 rounded-full p-0.5">
                <button
                    onClick={() => choose('list')}
                    aria-pressed={mode === 'list'}
                    className={`${base} ${mode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-ink'}`}
                >
                    <List size={16} />
                    Liste
                </button>
                <button
                    onClick={() => choose('grid')}
                    aria-pressed={mode === 'grid'}
                    className={`${base} ${mode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-ink'}`}
                >
                    <LayoutGrid size={16} />
                    Izgara
                </button>
            </div>

            {showHint && (
                <div className="absolute right-0 top-full mt-2 z-30 w-56 bg-ink text-gray-950 rounded-2xl p-3 text-xs leading-relaxed shadow-lg">
                    <div className="absolute -top-1.5 right-8 w-3 h-3 bg-ink rotate-45" />
                    <button
                        onClick={dismissHint}
                        className="absolute top-2 right-2 opacity-60 hover:opacity-100"
                        aria-label="Kapat"
                    >
                        <X size={14} />
                    </button>
                    <p className="font-bold pr-5">Görünümü değiştir</p>
                    <p className="mt-1 opacity-80">
                        Soruları <strong>Liste</strong> halinde okuyabilir ya da <strong>Izgara</strong> ile
                        fotoğraflara göz atabilirsin.
                    </p>
                </div>
            )}
        </div>
    )
}

export default ViewToggle