import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { useIsWide } from '../context/ViewModeContext'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

function AppLayout({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const wide = useIsWide()

    return (
        <div data-app className="bg-gray-950 min-h-screen text-ink">
            <TopBar />
            <main className={`${wide ? 'max-w-5xl' : 'max-w-2xl'} mx-auto pb-20 md:pb-8`}>{children}</main>
            {user && <BottomNav />}
        </div>
    )
}

export default AppLayout