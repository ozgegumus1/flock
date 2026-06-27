import { useNavigate } from 'react-router-dom'
import { Github, Linkedin } from 'lucide-react'

function AboutPage() {
    const navigate = useNavigate()

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">
            {/* Başlık */}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4 z-10">
                <button
                    onClick={() => navigate('/ayarlar')}
                    className="text-white hover:text-gray-400 transition"
                >
                    ← Geri
                </button>
                <h1 className="text-white font-bold text-xl">Hakkında</h1>
            </div>

            <div className="p-6 flex flex-col items-center text-center gap-2">
                <div className="text-purple-500 text-4xl font-bold mb-2">Flock</div>
                <p className="text-gray-400 text-sm max-w-sm">
                    Flock, modern web teknolojileriyle sıfırdan geliştirilmiş bir sosyal medya
                    deneyimi sunma amacıyla tasarlandı.
                </p>
            </div>

            <div className="divide-y divide-gray-800 mt-2">
                <div className="flex items-center justify-between px-4 py-4">
                    <span className="text-white text-sm">Sürüm</span>
                    <span className="text-gray-500 text-sm">1.0.0</span>
                </div>
                <div className="flex items-center justify-between px-4 py-4">
                    <span className="text-white text-sm">Geliştirici</span>
                    <span className="text-gray-500 text-sm">Özge Gümüş</span>
                </div>
            </div>

            {/* Linkler */}
            <div className="p-4 flex flex-col gap-2 mt-2">
                <a
                    href="https://github.com/ozgegumus1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900 transition border border-gray-800"
                >
                    <Github size={18} className="text-gray-400" />
                    <span className="text-white text-sm">GitHub</span>
                </a>
                <a
                    href="https://www.linkedin.com/in/ozgegumus1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900 transition border border-gray-800"
                >
                    <Linkedin size={18} className="text-gray-400" />
                    <span className="text-white text-sm">LinkedIn</span>
                </a>
            </div>

            <p className="text-gray-600 text-xs text-center mt-6 px-4">
                © {new Date().getFullYear()} Flock. Tüm hakları saklıdır.
            </p>
        </div>
    )
}

export default AboutPage