import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import AuthLayout, { AUTH_PRIMARY } from '../components/AuthLayout'
import ProfileFields, { validateProfile } from '../components/ProfileFields'
import type { ProfileValues } from '../components/ProfileFields'

function WelcomePage() {
    const { user } = useAuth()
    const { showToast } = useToast()

    const metaName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ''

    const [values, setValues] = useState<ProfileValues>({
        fullName: metaName,
        username: '',
        birthYear: '',
        gender: '',
        accepted: false,
    })
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        if (!user) return

        const problem = validateProfile(values)
        if (problem) {
            showToast(problem, 'error')
            return
        }

        const name = values.username.trim()
        const fullName = values.fullName.trim()

        setLoading(true)

        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', name.replace(/[_%]/g, '\\$&'))
            .neq('id', user.id)
            .maybeSingle()

        if (existing) {
            showToast('Bu kullanıcı adı alınmış, başka bir tane dene.', 'error')
            setLoading(false)
            return
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ username: name, full_name: fullName, gender: values.gender })
            .eq('id', user.id)

        if (profileError) {
            showToast('Profil kaydedilemedi. Kullanıcı adı alınmış olabilir, başka bir tane dene.', 'error')
            setLoading(false)
            return
        }

        const { error: privateError } = await supabase
            .from('profile_private')
            .upsert({ user_id: user.id, birth_year: Number(values.birthYear) }, { onConflict: 'user_id' })

        if (privateError) {
            showToast('Doğum yılı kaydedilemedi. Lütfen tekrar dene.', 'error')
            setLoading(false)
            return
        }

        const { error: authError } = await supabase.auth.updateUser({
            data: { username: name, full_name: fullName, gender: values.gender },
        })

        if (authError) {
            showToast('Bir sorun oluştu. Lütfen tekrar dene.', 'error')
            setLoading(false)
            return
        }

        showToast('Hoş geldin!', 'success')
        setLoading(false)
    }

    return (
        <AuthLayout
            title="Hoş geldin"
            subtitle="Başlamadan önce birkaç bilgiye ihtiyacımız var."
            footer={
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="text-gray-500 hover:text-ink transition"
                >
                    Çıkış yap
                </button>
            }
        >
            <ProfileFields values={values} onChange={setValues} />

            <button onClick={handleSave} disabled={loading} className={`${AUTH_PRIMARY} mt-5`}>
                {loading ? 'Kaydediliyor...' : 'Devam et'}
            </button>
        </AuthLayout>
    )
}

export default WelcomePage
