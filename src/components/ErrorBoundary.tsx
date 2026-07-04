import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error: any) {
        console.error('Yakalanan hata:', error)

        // Muhtemelen eski cache'lenmiş bir dosya parçası nedeniyle oluşan
        // yükleme hatasıysa, sayfayı otomatik olarak bir kez yenile
        const isChunkError =
            error?.message?.includes('Failed to fetch dynamically imported module') ||
            error?.message?.includes('Importing a module script failed') ||
            error?.name === 'ChunkLoadError'

        if (isChunkError && !sessionStorage.getItem('chunk-reload-attempted')) {
            sessionStorage.setItem('chunk-reload-attempted', 'true')
            window.location.reload()
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
                    <div className="text-purple-500 text-3xl font-bold">Flock</div>
                    <p className="text-white font-bold">Bir şeyler ters gitti</p>
                    <p className="text-gray-400 text-sm">Sayfa yenileniyor...</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl transition mt-2"
                    >
                        Sayfayı Yenile
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}