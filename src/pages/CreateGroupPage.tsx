import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Search, Check } from 'lucide-react'

function CreateGroupPage() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [groupName, setGroupName] = useState('')
    const [query, setQuery] = useState('')
    const [followedUsers, setFollowedUsers] = useState<any[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchFollowedUsers()
    }, [])

    const fetchFollowedUsers = async () => {
        const { data: followData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user?.id)
            .eq('status', 'accepted')

        const ids = (followData ?? []).map((f: any) => f.following_id)
        if (ids.length === 0) return

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', ids)

        setFollowedUsers(profiles ?? [])
    }

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleCreate = async () => {
        if (!groupName.trim()) {
            showToast('Lütfen bir grup adı gir.', 'error')
            return
        }
        if (selectedIds.size < 2) {
            showToast('En az 2 kişi seçmelisin.', 'error')
            return
        }

        setCreating(true)

        const { data: group, error } = await supabase
            .from('groups')
            .insert({ name: groupName.trim(), created_by: user?.id })
            .select()
            .single()

        if (error || !group) {
            showToast('Grup oluşturulamadı, tekrar dene.', 'error')
            setCreating(false)
            return
        }

        const members = [user?.id, ...Array.from(selectedIds)].map((id) => ({
            group_id: group.id,
            user_id: id,
        }))

        await supabase.from('group_members').insert(members)

        setCreating(false)
        showToast('Grup oluşturuldu!', 'success')
        navigate(`/gruplar/${group.id}`)
    }

    const filtered = followedUsers.filter((u) =>
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        (u.full_name ?? '').toLowerCase().includes(query.toLowerCase())
    )

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4 z-10">
                <button onClick={() => navigate(-1)} className="text-white hover:text-gray-400 transition">
                    ← Geri
                </button>
                <h1 className="text-white font-bold text-xl">Yeni Grup</h1>
            </div>

            <div className="p-4">
                <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Grup adı"
                    maxLength={50}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-purple-500 transition mb-4"
                />

                <div className="relative mb-3">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Takip ettiklerinde ara..."
                        className="w-full bg-gray-900 border border-gray-800 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition"
                    />
                </div>

                <p className="text-gray-500 text-xs mb-2">{selectedIds.size} kişi seçildi (en az 2 kişi gerekli)</p>
            </div>

            <div className="px-2">
                {filtered.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">
                        {followedUsers.length === 0 ? 'Grup kurmak için önce birilerini takip et.' : 'Sonuç bulunamadı.'}
                    </p>
                ) : (
                    filtered.map((u) => {
                        const isSelected = selectedIds.has(u.id)
                        return (
                            <div
                                key={u.id}
                                onClick={() => toggleSelect(u.id)}
                                className="flex items-center gap-3 px-2 py-3 hover:bg-gray-900 rounded-xl cursor-pointer transition"
                            >
                                {u.avatar_url ? (
                                    <img src={u.avatar_url} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-purple-500" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">{u.full_name || u.username}</p>
                                    <p className="text-gray-500 text-xs truncate">@{u.username}</p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-700'}`}>
                                    {isSelected && <Check size={14} className="text-white" />}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <div className="sticky bottom-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 p-4">
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
                >
                    {creating ? 'Oluşturuluyor...' : 'Grubu Oluştur'}
                </button>
            </div>
        </div>
    )
}

export default CreateGroupPage