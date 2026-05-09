import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ProfilePage() {
  const { user, profile, credits } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')

  const saveProfile = async () => {
    if (!user) return
    setSaving(true); setError('')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)
    if (error) setError(error.message)
    else { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    setSaving(false)
  }

  const avatar = profile?.full_name?.charAt(0).toUpperCase()
    ?? user?.email?.charAt(0).toUpperCase() ?? '?'

  const stats = [
    { label: 'Credits remaining', value: credits?.balance ?? 0,         color: 'var(--primary)'   },
    { label: 'Total purchased',   value: credits?.total_purchased ?? 0,  color: '#10b981'           },
    { label: 'Images generated',  value: credits?.total_used ?? 0,       color: 'var(--accent2)'   },
  ]

  return (
    <div style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg,var(--primary),var(--accent2))',
            color: 'white', fontWeight: 900, fontSize: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{avatar}</div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>
              {profile?.full_name ?? 'Your Profile'}
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '.875rem', marginTop: 2 }}>{user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="fade-up fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '20px 22px',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color, fontFamily: 'var(--font-display)' }}>
                {s.value.toLocaleString()}
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Edit profile */}
        <div className="card fade-up fade-up-2" style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, marginBottom: 20 }}>
            Account details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Full name</label>
              <input
                className="input" value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="label">Email address</label>
              <input className="input" value={user?.email ?? ''} disabled
                style={{ background: 'var(--bg2)', cursor: 'not-allowed', color: 'var(--text3)' }}
              />
              <p style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: 5 }}>
                Email cannot be changed here. Contact support if needed.
              </p>
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 14, background: 'rgba(239,68,68,.08)',
              border: '1px solid rgba(239,68,68,.2)', borderRadius: 10,
              padding: '10px 14px', fontSize: '.83rem', color: 'var(--danger)',
            }}>⚠️ {error}</div>
          )}

          <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-primary" onClick={saveProfile} disabled={saving}
              style={{ padding: '10px 24px', fontSize: '.875rem' }}>
              {saving ? <><div className="spinner" /> Saving…</> : 'Save changes'}
            </button>
            {saved && (
              <span style={{ fontSize: '.83rem', color: 'var(--success)', fontWeight: 600 }}>
                ✓ Saved!
              </span>
            )}
          </div>
        </div>

        {/* Member since */}
        <div className="card fade-up fade-up-3">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, marginBottom: 16 }}>
            Account info
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
              { label: 'Account ID',   value: user?.id?.slice(0, 8) + '…' ?? '—' },
              { label: 'Auth provider', value: user?.app_metadata?.provider ?? 'email' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
                fontSize: '.875rem',
              }}>
                <span style={{ color: 'var(--text2)' }}>{row.label}</span>
                <span style={{ fontWeight: 500, fontFamily: row.label === 'Account ID' ? 'var(--font-mono)' : 'inherit', fontSize: row.label === 'Account ID' ? '.8rem' : '.875rem' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
