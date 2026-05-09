import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PACKS = [
  { id: 'pack_100',  label: 'Starter',    credits: 100,  price: 5,   perImage: '5¢',  popular: false },
  { id: 'pack_250',  label: 'Creator',    credits: 250,  price: 10,  perImage: '4¢',  popular: true  },
  { id: 'pack_600',  label: 'Studio',     credits: 600,  price: 20,  perImage: '3.3¢',popular: false },
  { id: 'pro_month', label: 'Pro Monthly',credits: 500,  price: 19,  perImage: '3.8¢',popular: false, sub: true },
]

export default function PricingPage() {
  const { user } = useAuth()

  const handleBuy = (packId: string) => {
    if (!user) {
      window.location.href = '/auth?mode=signup&next=/pricing'
      return
    }
    // Phase 4: redirect to Stripe checkout
    alert(`Stripe checkout coming in Phase 4!\nPack: ${packId}`)
  }

  return (
    <div style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 12 }}>
            Simple pricing
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, marginBottom: 16 }}>
            Buy credits, generate images
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto' }}>
            No subscription required. Buy credits as you need them.
            New accounts get <strong style={{ color: 'var(--primary)' }}>10 free credits</strong> to get started.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 18 }}>
          {PACKS.map(pack => (
            <div key={pack.id} style={{
              background: 'var(--surface)',
              border: pack.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '28px 24px',
              position: 'relative',
              boxShadow: pack.popular ? '0 8px 32px rgba(124,58,237,.15)' : 'none',
            }}>
              {pack.popular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--primary)', color: 'white',
                  fontSize: '.72rem', fontWeight: 800, padding: '4px 16px',
                  borderRadius: 50, letterSpacing: '.06em', whiteSpace: 'nowrap',
                }}>MOST POPULAR</div>
              )}

              <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>
                {pack.label}
                {pack.sub && <span style={{ marginLeft: 8, fontSize: '.7rem', background: 'rgba(124,58,237,.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 50 }}>Monthly</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900 }}>${pack.price}</span>
                {pack.sub && <span style={{ color: 'var(--text3)', fontSize: '.85rem' }}>/mo</span>}
              </div>

              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700,
                color: 'var(--primary)', marginBottom: 6,
              }}>
                {pack.credits.toLocaleString()} images
              </div>

              <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: 24 }}>
                {pack.perImage} per image
              </div>

              <button
                onClick={() => handleBuy(pack.id)}
                className={pack.popular ? 'btn-primary' : 'btn-outline'}
                style={{ width: '100%', justifyContent: 'center', fontSize: '.875rem', padding: '11px' }}
              >
                {user ? 'Buy now' : 'Get started'}
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <p style={{ color: 'var(--text2)', fontSize: '.875rem' }}>
            Credits never expire · Secure payment via Stripe · Cancel subscription anytime
          </p>
          {!user && (
            <p style={{ marginTop: 10, fontSize: '.875rem' }}>
              <Link to="/auth?mode=signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Create a free account →
              </Link>
              {' '}to get your 10 free images first.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
