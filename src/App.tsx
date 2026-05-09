import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import ProfilePage from './pages/ProfilePage'
import PricingPage from './pages/PricingPage'

// ── Landing page (your existing HTML page as an iframe, or replace with React) ──
function LandingPage() {
  const { user } = useAuth()
  return (
    <div style={{ paddingTop: 'var(--nav-h)' }}>
      {/* Hero */}
      <section style={{
        minHeight: '90vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg,#ede9fe 0%,#fce7f3 50%,#fef3c7 100%)',
        textAlign: 'center', padding: '80px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        {[{s:500,t:-100,l:-150,c:'#a78bfa'},{s:400,t:'40%',r:-120,c:'#ec4899'},{s:350,b:-80,l:'30%',c:'#f59e0b'}].map((o,i)=>(
          <div key={i} style={{
            position:'absolute', width:o.s, height:o.s, borderRadius:'50%',
            background:o.c, filter:'blur(72px)', opacity:.45, pointerEvents:'none',
            top:(o as any).t, left:(o as any).l, right:(o as any).r, bottom:(o as any).b,
          }}/>
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,.75)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(124,58,237,.2)', borderRadius: 50,
            padding: '8px 20px', fontSize: '.8rem', fontWeight: 700,
            color: 'var(--primary)', letterSpacing: '.08em', textTransform: 'uppercase',
            marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            Powered by Real AI APIs
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem,8vw,7rem)',
            fontWeight: 900, lineHeight: 1.05, letterSpacing: '-.03em', marginBottom: 20,
          }}>
            <span style={{ background:'linear-gradient(135deg,var(--primary),var(--accent2))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Unleash Your
            </span><br/>
            <span style={{ WebkitTextStroke: '2px var(--text)', WebkitTextFillColor: 'transparent' }}>
              Imagination
            </span>
          </h1>

          <p style={{ maxWidth: 520, margin: '0 auto 40px', fontSize: '1.1rem', color: 'var(--text2)', lineHeight: 1.7 }}>
            Create breathtaking art with OpenAI DALL-E, Stability AI, and Hugging Face.
            Get <strong style={{ color: 'var(--primary)' }}>10 free images</strong> when you sign up.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <a href="/dashboard" className="btn-primary" style={{ padding: '14px 36px', fontSize: '1rem', textDecoration: 'none' }}>
                ✦ Start Generating
              </a>
            ) : (
              <>
                <a href="/auth?mode=signup" className="btn-primary" style={{ padding: '14px 36px', fontSize: '1rem', textDecoration: 'none' }}>
                  Get 10 Free Images
                </a>
                <a href="/auth?mode=signin" className="btn-outline" style={{ padding: '13px 32px', fontSize: '1rem', textDecoration: 'none' }}>
                  Sign in
                </a>
              </>
            )}
          </div>

          {/* Social proof */}
          <p style={{ marginTop: 32, fontSize: '.82rem', color: 'var(--text3)' }}>
            No credit card required · 10 free images on signup · Cancel anytime
          </p>
        </div>
      </section>

      {/* Features row */}
      <section style={{ padding: '80px 64px', background: 'var(--bg2)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 12 }}>Why ArtMind AI</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 800 }}>
              Three providers, <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>one interface</em>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
            {[
              { icon: '🎨', title: 'DALL-E 3',          desc: 'OpenAI\'s flagship model. Exceptional quality and prompt accuracy.' },
              { icon: '⚡', title: 'Stable Diffusion',  desc: 'Stability AI\'s powerful XL models with fine-grained style control.' },
              { icon: '🤗', title: 'Hugging Face',      desc: 'Hundreds of open-source models. Great for creative experimentation.' },
              { icon: '✦',  title: '10 Free Credits',   desc: 'Every new account starts with 10 free images. No card needed.' },
            ].map(f => (
              <div key={f.title} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '26px 24px',
                transition: 'transform var(--t), box-shadow var(--t)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 14px 36px rgba(124,58,237,.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
              >
                <div style={{ fontSize: '1.6rem', marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Root app ──────────────────────────────────────────────
function AppInner() {
  const { loading } = useAuth()
  if (loading) {
    return (
      <div className="page-loader">
        <div className="logo">ArtMind AI</div>
        <div className="spinner spinner-dark" />
      </div>
    )
  }
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/auth"      element={<AuthPage />} />
        <Route path="/pricing"   element={<PricingPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/gallery"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="*"          element={<div style={{ paddingTop:'var(--nav-h)', textAlign:'center', padding:'120px 24px', fontFamily:'var(--font-display)', fontSize:'2rem' }}>404 – Page not found</div>} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  )
}
