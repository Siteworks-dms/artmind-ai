import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function SuccessPage() {
  const [params]  = useSearchParams()
  const sessionId = params.get('session_id')
  const { refreshCredits, credits } = useAuth()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Refresh credits a couple of times to pick up webhook update
    const refresh = async () => {
      await refreshCredits()
      setChecked(true)
    }
    refresh()
    const timer = setTimeout(refresh, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{
      paddingTop: 'var(--nav-h)', minHeight: '100vh',
      background: 'linear-gradient(135deg,#ede9fe 0%,#fce7f3 50%,#fef3c7 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      {/* Orbs */}
      <div style={{ position:'fixed', width:400, height:400, borderRadius:'50%', background:'#a78bfa', filter:'blur(80px)', opacity:.35, top:-100, left:-100, pointerEvents:'none' }}/>
      <div style={{ position:'fixed', width:300, height:300, borderRadius:'50%', background:'#ec4899', filter:'blur(80px)', opacity:.35, bottom:-80, right:-80, pointerEvents:'none' }}/>

      <div className="card fade-up" style={{
        maxWidth: 480, width: '100%', textAlign: 'center',
        padding: '48px 40px', boxShadow: '0 24px 64px rgba(124,58,237,.15)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Checkmark */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
          background: 'linear-gradient(135deg,#10b981,#059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', boxShadow: '0 8px 24px rgba(16,185,129,.3)',
        }}>✓</div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem',
          fontWeight: 900, marginBottom: 12,
        }}>Payment successful!</h1>

        <p style={{ color: 'var(--text2)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 28 }}>
          Your credits have been added to your account.
          {checked && credits && (
            <> You now have{' '}
              <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                {credits.balance} credits
              </strong>.
            </>
          )}
        </p>

        {sessionId && (
          <div style={{
            background: 'var(--bg2)', borderRadius: 10, padding: '10px 16px',
            fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)',
            marginBottom: 28, wordBreak: 'break-all',
          }}>
            Order: {sessionId.slice(0, 24)}…
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard" className="btn-primary" style={{
            textDecoration: 'none', padding: '13px 32px',
          }}>
            ✦ Start Generating
          </Link>
          <Link to="/profile" className="btn-ghost" style={{ textDecoration: 'none' }}>
            View Profile
          </Link>
        </div>

        <p style={{ marginTop: 24, fontSize: '.8rem', color: 'var(--text3)' }}>
          A receipt has been sent to your email by Stripe.
        </p>
      </div>
    </div>
  )
}
