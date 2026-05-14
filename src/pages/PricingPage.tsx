import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const PACKS = [
  {
    id:       'starter',
    label:    'Starter',
    credits:  100,
    price:    5,
    per:      '5¢ / image',
    color:    'var(--border)',
    popular:  false,
    priceEnv: 'STRIPE_PRICE_STARTER',
    features: ['100 image credits', 'All AI providers', 'DALL-E 2 & 3', 'No watermark', 'Credits never expire'],
  },
  {
    id:       'creator',
    label:    'Creator',
    credits:  250,
    price:    10,
    per:      '4¢ / image',
    color:    'var(--primary)',
    popular:  true,
    priceEnv: 'STRIPE_PRICE_CREATOR',
    features: ['250 image credits', 'All AI providers', 'DALL-E 2 & 3', 'No watermark', 'Credits never expire'],
  },
  {
    id:       'studio',
    label:    'Studio',
    credits:  600,
    price:    20,
    per:      '3.3¢ / image',
    color:    '#10b981',
    popular:  false,
    priceEnv: 'STRIPE_PRICE_STUDIO',
    features: ['600 image credits', 'All AI providers', 'Priority generation', 'No watermark', 'Credits never expire'],
  },
  {
    id:       'pro',
    label:    'Pro Monthly',
    credits:  500,
    price:    19,
    per:      'per month',
    color:    'var(--accent2)',
    popular:  false,
    sub:      true,
    priceEnv: 'STRIPE_PRICE_PRO',
    features: ['500 credits / month', 'Auto-renewed monthly', 'All future AI tools', 'Priority support', 'Early access features'],
  },
]

export default function PricingPage() {
  const { user, credits } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const [error,   setError]   = useState('')

  const handleBuy = async (pack: typeof PACKS[0]) => {
    if (!user) {
      navigate('/auth?mode=signup&next=/pricing')
      return
    }

    setLoading(pack.id); setError('')

    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Not authenticated')

      // Get the price ID from the env-mapped pack
      // In production these map to real Stripe price IDs via env vars
      const priceIdMap: Record<string, string> = {
        starter: import.meta.env.VITE_STRIPE_PRICE_STARTER ?? '',
        creator: import.meta.env.VITE_STRIPE_PRICE_CREATOR ?? '',
        studio:  import.meta.env.VITE_STRIPE_PRICE_STUDIO  ?? '',
        pro:     import.meta.env.VITE_STRIPE_PRICE_PRO     ?? '',
      }

      const priceId = priceIdMap[pack.id]
      if (!priceId) throw new Error('Price not configured. Please contact support.')

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create checkout session')

      // Redirect to Stripe Checkout
      window.location.href = json.url

    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '64px 24px' }}>

        {/* Header */}
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            fontSize: '.75rem', fontWeight: 700, letterSpacing: '.12em',
            textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 14,
          }}>Simple pricing</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem,5vw,3.5rem)',
            fontWeight: 900, marginBottom: 16, lineHeight: 1.1,
          }}>
            Buy credits,<br/>
            <span style={{
              background: 'linear-gradient(135deg,var(--primary),var(--accent2))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>generate images</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '1.05rem', maxWidth: 480, margin: '0 auto' }}>
            No subscription required. Buy credits as you need them.
            New accounts get <strong style={{ color: 'var(--primary)' }}>10 free credits</strong> to get started.
          </p>

          {/* Current balance */}
          {user && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.2)',
              borderRadius: 50, padding: '8px 20px', marginTop: 20,
              fontSize: '.85rem', fontWeight: 600, color: 'var(--primary)',
            }}>
              ✦ You currently have <strong>{credits?.balance ?? 0} credits</strong>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
            borderRadius: 'var(--radius)', padding: '14px 20px',
            fontSize: '.875rem', color: 'var(--danger)', marginBottom: 32, textAlign: 'center',
          }}>⚠️ {error}</div>
        )}

        {/* Pricing cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
          gap: 20, marginBottom: 48,
        }}>
          {PACKS.map(pack => (
            <div key={pack.id} className="fade-up" style={{
              background: 'var(--surface)',
              border: pack.popular ? `2px solid var(--primary)` : '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '28px 24px',
              position: 'relative',
              boxShadow: pack.popular ? '0 8px 32px rgba(124,58,237,.15)' : 'none',
              transition: 'transform var(--t), box-shadow var(--t)',
            }}
            onMouseEnter={e => {
              if (!pack.popular) {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,.08)'
              }
            }}
            onMouseLeave={e => {
              if (!pack.popular) {
                (e.currentTarget as HTMLDivElement).style.transform = ''
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
              }
            }}
            >
              {pack.popular && (
                <div style={{
                  position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg,var(--primary),var(--accent2))',
                  color: 'white', fontSize: '.7rem', fontWeight: 800,
                  padding: '4px 16px', borderRadius: 50,
                  letterSpacing: '.06em', whiteSpace: 'nowrap',
                }}>✦ MOST POPULAR</div>
              )}

              {/* Label */}
              <div style={{
                fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)',
                marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {pack.label}
                {pack.sub && (
                  <span style={{
                    fontSize: '.68rem', background: 'rgba(236,72,153,.1)',
                    color: 'var(--accent2)', padding: '2px 8px', borderRadius: 50,
                  }}>Monthly</span>
                )}
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 4 }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.6rem', fontWeight: 900, lineHeight: 1,
                }}>${pack.price}</span>
                {pack.sub && (
                  <span style={{ color: 'var(--text3)', fontSize: '.85rem' }}>/mo</span>
                )}
              </div>

              {/* Credits */}
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '1.2rem',
                fontWeight: 800, color: pack.popular ? 'var(--primary)' : 'var(--text)',
                marginBottom: 4,
              }}>
                {pack.credits.toLocaleString()} images
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: 22 }}>
                {pack.per}
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {pack.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.82rem', color: 'var(--text2)' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '.75rem' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleBuy(pack)}
                disabled={loading === pack.id}
                className={pack.popular ? 'btn-primary' : 'btn-outline'}
                style={{
                  width: '100%', justifyContent: 'center',
                  fontSize: '.875rem', padding: '12px',
                  borderRadius: 12,
                }}
              >
                {loading === pack.id
                  ? <><div className={pack.popular ? 'spinner' : 'spinner spinner-dark'} /> Processing…</>
                  : user ? (pack.sub ? 'Subscribe now' : 'Buy now') : 'Get started'
                }
              </button>
            </div>
          ))}
        </div>

        {/* Footer notes */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text3)', fontSize: '.85rem', marginBottom: 10 }}>
            🔒 Secure checkout via Stripe · Credits never expire · Cancel subscription anytime
          </p>
          <p style={{ color: 'var(--text3)', fontSize: '.82rem', marginBottom: 10 }}>
            Accepted: Visa, Mastercard, American Express, Apple Pay, Google Pay
          </p>
          {!user && (
            <p style={{ fontSize: '.875rem', marginTop: 16 }}>
              <Link to="/auth?mode=signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Create a free account →
              </Link>{' '}
              to get 10 free images first. No card required.
            </p>
          )}
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 72 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.8rem',
            fontWeight: 800, textAlign: 'center', marginBottom: 36,
          }}>Frequently asked questions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {[
              { q: 'Do credits expire?', a: 'No — your purchased credits never expire. Use them at any pace.' },
              { q: 'Can I cancel my subscription?', a: 'Yes, anytime from your Profile page. You keep your remaining credits.' },
              { q: 'Which AI models are included?', a: 'All plans include OpenAI DALL-E 2 & 3, Stability AI, and Hugging Face models.' },
              { q: 'How many credits per image?', a: 'Each generation costs 1 credit regardless of model or size.' },
              { q: 'Is payment secure?', a: 'Yes — payments are handled by Stripe. We never store card details.' },
              { q: 'Can I get a refund?', a: 'Unused credits within 7 days are eligible for refund. Contact support.' },
            ].map(item => (
              <div key={item.q} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '22px 24px',
              }}>
                <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 8 }}>{item.q}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.6 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
