import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [unreadMessages, setUnreadMessages] = useState(0)
    const [unreadNotifications, setUnreadNotifications] = useState(0)

    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data ?? null)
    }

   const refreshProfile = () => {
        if (user?.id) fetchProfile(user.id)
    }

    const refreshUnreadNotifications = () => {
        if (user?.id) fetchUnreadNotifications(user.id)
    }

    const fetchUnreadMessages = async (userId: string) => {
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact' })
            .eq('receiver_id', userId)
            .eq('is_read', false)

        setUnreadMessages(count ?? 0)
    }

    const fetchUnreadNotifications = async (userId: string) => {
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .eq('is_read', false)

        setUnreadNotifications(count ?? 0)
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            setLoading(false)
        })

        supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setProfile(null)
            }
        })
    }, [])

    useEffect(() => {
        if (!user?.id) {
            setUnreadMessages(0)
            setUnreadNotifications(0)
            return
        }

        fetchUnreadMessages(user.id)
        fetchUnreadNotifications(user.id)

        const messagesChannel = supabase
            .channel('global-unread-messages')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`,
            }, () => fetchUnreadMessages(user.id))
            .subscribe()

        const notifChannel = supabase
            .channel('global-unread-notifications')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`,
            }, () => fetchUnreadNotifications(user.id))
            .subscribe()

        return () => {
            supabase.removeChannel(messagesChannel)
            supabase.removeChannel(notifChannel)
        }
    }, [user?.id])

    return (
     <AuthContext.Provider value={{
            user,
            profile,
            loading,
            refreshProfile,
            unreadMessages,
            unreadNotifications,
            refreshUnreadNotifications,
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}