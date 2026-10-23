import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

interface PollBoxProps {
    postId: string
    pollType: 'options' | 'rating' | 'quick'
}

interface Option {
    id: string
    label: string | null
    image_url: string | null
}

interface ResultRow {
    option_id: string | null
    value: number | null
    vote_count: number
}

const QUICK_CHOICES = [
    { value: 1, emoji: '😍', label: 'Çok güzel' },
    { value: 2, emoji: '🙂', label: 'Fena değil' },
    { value: 3, emoji: '🔄', label: 'Değiştir' },
]

function PollBox({ postId, pollType }: PollBoxProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const [options, setOptions] = useState<Option[]>([])
    const [results, setResults] = useState<ResultRow[]>([])
    const [myOptionId, setMyOptionId] = useState<string | null>(null)
    const [myValue, setMyValue] = useState<number | null>(null)
    const [showResults, setShowResults] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const hasVoted = myOptionId !== null || myValue !== null

    const fetchResults = async () => {
        const { data } = await supabase
            .from('poll_results')
            .select('option_id, value, vote_count')
            .eq('post_id', postId)

        setResults(
            (data ?? []).map((r: any) => ({
                option_id: r.option_id,
                value: r.value,
                vote_count: Number(r.vote_count),
            }))
        )
    }

    useEffect(() => {
        const load = async () => {
            setLoading(true)

            if (pollType === 'options') {
                const { data } = await supabase
                    .from('poll_options')
                    .select('id, label, image_url')
                    .eq('post_id', postId)
                    .order('sort_order', { ascending: true })
                setOptions(data ?? [])
            }

            if (user) {
                const { data: mine } = await supabase
                    .from('poll_votes')
                    .select('option_id, value')
                    .eq('post_id', postId)
                    .eq('user_id', user.id)
                    .maybeSingle()

                setMyOptionId(mine?.option_id ?? null)
                setMyValue(mine?.value ?? null)
            }

            await fetchResults()
            setLoading(false)
        }

        load()
    }, [postId, pollType])

    const vote = async (optionId: string | null, value: number | null) => {
        if (!user) {
            showToast('Oy vermek için giriş yapmalısın.', 'error')
            navigate('/giris')
            return
        }

        if (saving) return

        setSaving(true)

        const { error } = await supabase
            .from('poll_votes')
            .upsert(
                { post_id: postId, user_id: user.id, option_id: optionId, value },
                { onConflict: 'post_id,user_id' }
            )

        if (error) {
            showToast('Oyun kaydedilemedi. Lütfen tekrar dene.', 'error')
            setSaving(false)
            return
        }

        setMyOptionId(optionId)
        setMyValue(value)
        await fetchResults()
        setSaving(false)
    }

    const removeVote = async () => {
        if (saving || !user) return

        setSaving(true)

        const { error } = await supabase
            .from('poll_votes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id)

        if (error) {
            showToast('Oy geri alınamadı. Lütfen tekrar dene.', 'error')
            setSaving(false)
            return
        }

        setMyOptionId(null)
        setMyValue(null)
        setShowResults(false)
        await fetchResults()
        setSaving(false)
    }

    const total = results.reduce((sum, r) => sum + r.vote_count, 0)
    const resultsVisible = hasVoted || showResults

    const countForOption = (id: string) =>
        results.find((r) => r.option_id === id)?.vote_count ?? 0

    const countForValue = (v: number) =>
        results.filter((r) => r.value === v).reduce((sum, r) => sum + r.vote_count, 0)

    const percent = (count: number) => (total === 0 ? 0 : Math.round((count / total) * 100))

    const average =
        total === 0
            ? 0
            : results.reduce((sum, r) => sum + (r.value ?? 0) * r.vote_count, 0) / total

    if (loading) {
        return <div className="mt-3 h-24 bg-gray-900 rounded-2xl animate-pulse" />
    }

    return (
        <div className="mt-3 bg-gray-900 border border-gray-800 rounded-2xl p-4">

            {pollType === 'options' && (
                <div className={`grid gap-3 ${options.length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    {options.map((option) => {
                        const count = countForOption(option.id)
                        const isMine = myOptionId === option.id

                        return (
                            <button
                                key={option.id}
                                onClick={() => vote(option.id, null)}
                                disabled={saving}
                                className={`relative overflow-hidden text-left rounded-xl border transition ${
                                    isMine
                                        ? 'border-purple-500'
                                        : 'border-gray-800 hover:border-purple-500/60'
                                }`}
                            >
                                {option.image_url && (
                                    <img
                                        src={option.image_url}
                                        alt={option.label ?? ''}
                                        className="w-full aspect-square object-cover"
                                        loading="lazy"
                                    />
                                )}

                                <div className="relative px-3 py-2.5">
                                    {resultsVisible && (
                                        <div
                                            className="absolute inset-y-0 left-0 bg-purple-600/25"
                                            style={{ width: `${percent(count)}%` }}
                                        />
                                    )}
                                    <div className="relative flex items-center justify-between gap-2">
                                        <span className="text-ink text-sm font-bold truncate">
                                            {option.label || `Seçenek ${options.indexOf(option) + 1}`}
                                        </span>
                                        {resultsVisible && (
                                            <span className="text-purple-300 text-sm font-bold shrink-0">
                                                %{percent(count)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {pollType === 'rating' && (
                <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => vote(null, star)}
                                disabled={saving}
                                className="p-1 transition hover:scale-110"
                                aria-label={`${star} yıldız`}
                            >
                                <Star
                                    size={30}
                                    className={
                                        myValue !== null && star <= myValue
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-600'
                                    }
                                />
                            </button>
                        ))}
                    </div>

                    {resultsVisible && (
                        <p className="text-gray-300 text-sm">
                            {total === 0
                                ? 'Henüz oy yok'
                                : `Ortalama ${average.toFixed(1)} · ${total} oy`}
                        </p>
                    )}
                </div>
            )}

            {pollType === 'quick' && (
                <div className="grid grid-cols-3 gap-2">
                    {QUICK_CHOICES.map((choice) => {
                        const count = countForValue(choice.value)
                        const isMine = myValue === choice.value

                        return (
                            <button
                                key={choice.value}
                                onClick={() => vote(null, choice.value)}
                                disabled={saving}
                                className={`rounded-xl border px-2 py-3 text-center transition ${
                                    isMine
                                        ? 'border-purple-500 bg-purple-600/20'
                                        : 'border-gray-800 hover:border-purple-500/60'
                                }`}
                            >
                                <div className="text-2xl">{choice.emoji}</div>
                                <div className="text-ink text-xs font-bold mt-1">{choice.label}</div>
                                {resultsVisible && (
                                    <div className="text-purple-300 text-xs mt-1">%{percent(count)}</div>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}

            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>{resultsVisible ? `${total} oy` : 'Oy vererek sonuçları gör'}</span>

                {hasVoted ? (
                    <button
                        onClick={removeVote}
                        disabled={saving}
                        className="hover:text-ink transition"
                    >
                        Oyumu geri al
                    </button>
                ) : (
                    !showResults && (
                        <button
                            onClick={() => setShowResults(true)}
                            className="hover:text-ink transition"
                        >
                            Sonuçlara bak
                        </button>
                    )
                )}
            </div>

        </div>
    )
}

export default PollBox
