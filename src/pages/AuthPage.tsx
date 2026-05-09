import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const [params]      = useSearchParams()
  const mode          = (params.get('mode') ?? 'signin') as 'signin' | 'signup'
  const nextPath      = params.get('next') ?? '/dashboard'

  const [isSignUp, setIsSignUp] = useState(mode === 'signup')
  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')
  const [loading,   setLoading]   = useState(false)

  const { signIn, signUp, signInGoogle, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate(nextPath, { replace: true }) }, [user])
  useEffect(() => { setIsSignUp(mode === 'signup') }, [mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    if (isSignUp && !fullName) { setError('Please enter your name.'); return }

    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setIsSignUp(false)
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate(nextPath, { replace: true })
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    const { error } = await signInGoogle()
    if (error) setError(error.message)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #ede9fe 0%, #fce7f3 50%, #fef3c7 100%)',
      padding: '80px 20px 40px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Blurred orbs */}
      {[
        { size: 400, top: -100, left: -150, color: '#a78bfa' },
        { size: 300, bottom: -80, right: -100, color: '#ec4899' },
      ].map((o, i) => (
        <div key={i} style={{
          position: 'absolute', width: o.size, height: o.size, borderRadius: '50%',
          background: o.color, filter: 'blur(72px)', opacity: .4, pointerEvents: 'none',
          top: o.top, left: o.left, bottom: (o as any).bottom, right: (o as any).right,
        }} />
      ))}

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{
            fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900,
            background: 'linear-gradient(135deg,var(--primary),var(--accent2))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ArtMind AI
          </Link>
        </div>

        {/* Card */}
        <div className="card fade-up fade-up-1" style={{
          boxShadow: '0 24px 64px rgba(124,58,237,.12)', padding: 36,
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800,
            marginBottom: 6, textAlign: 'center',
          }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '.9rem', marginBottom: 28 }}>
            {isSignUp
              ? 'Get 10 free image credits — no card required'
              : 'Sign in to continue generating'}
          </p>

          {/* Free credits callout */}
          {isSignUp && (
            <div style={{
              background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: '1.2rem' }}>🎁</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#065f46' }}>
                  10 free credits on signup
                </div>
                <div style={{ fontSize: '.78rem', color: '#047857' }}>
                  Each credit = 1 AI-generated image
                </div>
              </div>
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            style={{
              width: '100%', padding: '12px', borderRadius: 12,
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: '.9rem', fontWeight: 600, color: 'var(--text)',
              cursor: 'pointer', transition: 'background var(--t), border-color var(--t)',
              marginBottom: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.48h4.844c-.209 1.125-.843 2.078-1.797 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider">or</div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isSignUp && (
              <div>
                <label className="label">Full name</label>
                <input
                  className={`input${error && !fullName ? ' error' : ''}`}
                  type="text" placeholder="Jane Smith" value={fullName}
                  onChange={e => setFullName(e.target.value)} autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="label">Email address</label>
              <input
                className="input" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="label" style={{ margin: 0 }}>Password</label>
                {!isSignUp && (
                  <Link to="/auth/reset" style={{ fontSize: '.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Forgot password?
                  </Link>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="input" type={showPass ? 'text' : 'password'}
                  placeholder={isSignUp ? 'At least 6 characters' : '••••••••'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button" onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text3)', fontSize: '1rem', background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >{showPass ? '🙈' : '👁'}</button>
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)',
                borderRadius: 10, padding: '10px 14px', fontSize: '.83rem',
                color: 'var(--danger)', display: 'flex', gap: 8,
              }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{
                background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)',
                borderRadius: 10, padding: '10px 14px', fontSize: '.83rem',
                color: '#065f46', display: 'flex', gap: 8,
              }}>
                ✓ {success}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '13px' }}>
              {loading && <div className="spinner" />}
              {isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {/* Toggle mode */}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '.875rem', color: 'var(--text2)' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsSignUp(s => !s); setError(''); setSuccess('') }}
              style={{ color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: '.875rem' }}
            >
              {isSignUp ? 'Sign in' : 'Create one free'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '.76rem', color: 'var(--text3)' }}>
          By signing up you agree to our{' '}
          <a href="#" style={{ color: 'var(--primary)' }}>Terms</a> and{' '}
          <a href="#" style={{ color: 'var(--primary)' }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
