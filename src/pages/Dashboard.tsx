import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const PROVIDERS = {
  openai: {
    label: 'OpenAI DALL-E',
    color: '#10a37f',
    models: ['dall-e-3', 'dall-e-2'],
    sizes:  ['1024x1024', '1792x1024', '1024x1792', '512x512'],
  },
  stability: {
    label: 'Stability AI',
    color: '#7b4fe2',
    models: ['stable-diffusion-xl-1024-v1-0', 'stable-diffusion-v1-6'],
    sizes:  ['1024x1024', '896x1152', '768x768', '512x512'],
  },
  hf: {
    label: 'Hugging Face',
    color: '#ff9d00',
    models: ['stabilityai/stable-diffusion-xl-base-1.0', 'runwayml/stable-diffusion-v1-5', 'prompthero/openjourney'],
    sizes:  ['512x512', '768x768'],
  },
} as const

type Provider = keyof typeof PROVIDERS

const STYLES = ['Creative', 'Futurism', 'Steampunk', 'Gothic', 'Space', 'Photorealistic']

interface ResultImage {
  url: string
  prompt: string
  model: string
  provider: Provider
}

export default function Dashboard() {
  const { user, credits, refreshCredits } = useAuth()

  const [provider, setProvider] = useState<Provider>('openai')
  const [model,    setModel]    = useState(PROVIDERS.openai.models[0])
  const [size,     setSize]     = useState(PROVIDERS.openai.sizes[0])
  const [style,    setStyle]    = useState('Creative')
  const [prompt,   setPrompt]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [results,  setResults]  = useState<ResultImage[]>([])

  const switchProvider = (p: Provider) => {
    setProvider(p)
    setModel(PROVIDERS[p].models[0])
    setSize(PROVIDERS[p].sizes[0])
  }

  const generate = async () => {
    if (!prompt.trim()) { setError('Please enter a prompt.'); return }
    if ((credits?.balance ?? 0) < 1) { setError('You have no credits. Please top up to continue.'); return }

    setError(''); setLoading(true)

    try {
      // Call our serverless proxy (Phase 2 will add this)
      // For now, calls API directly (replace with /api/generate in Phase 2)
      const fullPrompt = style !== 'Creative' ? `${prompt.trim()}, ${style} style` : prompt.trim()

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ prompt: fullPrompt, model, provider, size }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Generation failed (${res.status})`)
      }

      const data = await res.json()
      const newImages: ResultImage[] = (data.images as string[]).map(url => ({
        url, prompt: fullPrompt, model, provider,
      }))

      setResults(prev => [...newImages, ...prev])
      await refreshCredits()

    } catch (e: any) {
      setError(e.message ?? 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = (url: string, idx: number) => {
    const a = document.createElement('a')
    a.href = url; a.download = `artmind-${Date.now()}-${idx}.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  return (
    <div style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* HERO GENERATE AREA */}
      <section style={{
        background: 'linear-gradient(135deg,#ede9fe 0%,#fce7f3 50%,#fef3c7 100%)',
        padding: '64px 24px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Orbs */}
        {[{s:400,t:-100,l:-150,c:'#a78bfa'},{s:320,t:'40%',r:-100,c:'#ec4899'}].map((o,i)=>(
          <div key={i} style={{
            position:'absolute',width:o.s,height:o.s,borderRadius:'50%',
            background:o.c,filter:'blur(72px)',opacity:.4,pointerEvents:'none',
            top:o.t,left:(o as any).l,right:(o as any).r,
          }}/>
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Credits display */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,.8)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(124,58,237,.2)', borderRadius: 50,
            padding: '7px 18px', marginBottom: 28,
            fontSize: '.82rem', fontWeight: 700, color: 'var(--primary)',
          }}>
            <span>✦</span>
            <span>{credits?.balance ?? 0} credits remaining</span>
            {(credits?.balance ?? 0) <= 2 && (
              <Link to="/pricing" style={{
                background: 'var(--primary)', color: 'white',
                padding: '3px 10px', borderRadius: 50, fontSize: '.73rem', marginLeft: 4,
              }}>Top up</Link>
            )}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem,5vw,4.5rem)',
            fontWeight: 900, lineHeight: 1.05, letterSpacing: '-.03em', marginBottom: 14,
          }}>
            <span style={{
              background: 'linear-gradient(135deg,var(--primary),var(--accent2))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Create anything</span><br/>
            <span style={{ WebkitTextStroke: '2px var(--text)', WebkitTextFillColor: 'transparent' }}>
              with AI
            </span>
          </h1>

          {/* Provider tabs */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            {(Object.keys(PROVIDERS) as Provider[]).map(p => (
              <button key={p} onClick={() => switchProvider(p)} style={{
                padding: '8px 20px', borderRadius: 50, fontWeight: 700,
                fontSize: '.82rem', cursor: 'pointer',
                border: `2px solid ${provider === p ? PROVIDERS[p].color : 'var(--border)'}`,
                background: provider === p ? PROVIDERS[p].color : 'rgba(255,255,255,.85)',
                color: provider === p ? 'white' : 'var(--text2)',
                transition: 'all var(--t)',
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: provider === p ? 'rgba(255,255,255,.7)' : PROVIDERS[p].color,
                  display: 'inline-block',
                }} />
                {PROVIDERS[p].label}
              </button>
            ))}
          </div>

          {/* Prompt input */}
          <div style={{ maxWidth: 700, margin: '0 auto 16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(16px)',
              border: `1.5px solid ${loading ? 'var(--primary)' : 'rgba(124,58,237,.2)'}`,
              borderRadius: 28, padding: '8px 8px 8px 20px',
              boxShadow: '0 12px 48px rgba(124,58,237,.1)',
              transition: 'border-color var(--t)',
            }}>
              <input
                value={prompt} onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generate()}
                placeholder="A cyberpunk samurai standing in neon rain, 8K cinematic…"
                style={{
                  flex: 1, border: 'none', background: 'transparent', outline: 'none',
                  fontSize: '1rem', color: 'var(--text)', padding: '10px 0',
                }}
              />
              <button
                onClick={generate} disabled={loading || (credits?.balance ?? 0) < 1}
                className="btn-primary"
                style={{ borderRadius: 20, padding: '12px 28px', fontSize: '.9rem' }}
              >
                {loading ? <><div className="spinner" /> Generating…</> : '✦ Generate'}
              </button>
            </div>
          </div>

          {/* Controls row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {/* Model */}
            <div style={{ position: 'relative' }}>
              <select value={model} onChange={e => setModel(e.target.value)} style={{
                appearance: 'none', background: 'rgba(255,255,255,.85)',
                border: '1.5px solid var(--border)', borderRadius: 50,
                padding: '9px 34px 9px 16px', fontSize: '.8rem', fontWeight: 500,
                color: 'var(--text)', cursor: 'pointer', outline: 'none',
              }}>
                {PROVIDERS[provider].models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none', fontSize: '.7rem' }}>▾</span>
            </div>

            {/* Size */}
            <div style={{ position: 'relative' }}>
              <select value={size} onChange={e => setSize(e.target.value)} style={{
                appearance: 'none', background: 'rgba(255,255,255,.85)',
                border: '1.5px solid var(--border)', borderRadius: 50,
                padding: '9px 34px 9px 16px', fontSize: '.8rem', fontWeight: 500,
                color: 'var(--text)', cursor: 'pointer', outline: 'none',
              }}>
                {PROVIDERS[provider].sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none', fontSize: '.7rem' }}>▾</span>
            </div>

            {/* Style pills */}
            {STYLES.map(s => (
              <button key={s} onClick={() => setStyle(s)} style={{
                background: style === s ? 'var(--primary)' : 'rgba(255,255,255,.85)',
                color: style === s ? 'white' : 'var(--text2)',
                border: `1.5px solid ${style === s ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 50, padding: '9px 16px', fontSize: '.78rem', fontWeight: 500,
                cursor: 'pointer', transition: 'all var(--t)',
              }}>{s}</button>
            ))}
          </div>

          {/* No credits warning */}
          {(credits?.balance ?? 0) < 1 && (
            <div style={{
              marginTop: 20, background: 'rgba(239,68,68,.08)',
              border: '1px solid rgba(239,68,68,.2)', borderRadius: 14,
              padding: '14px 20px', maxWidth: 500, margin: '20px auto 0',
              fontSize: '.875rem', color: 'var(--danger)',
            }}>
              You've used all your free credits.{' '}
              <Link to="/pricing" style={{ fontWeight: 700, color: 'var(--danger)', textDecoration: 'underline' }}>
                Buy more to continue generating →
              </Link>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 16, background: 'rgba(239,68,68,.08)',
              border: '1px solid rgba(239,68,68,.2)', borderRadius: 14,
              padding: '12px 18px', maxWidth: 500, margin: '16px auto 0',
              fontSize: '.83rem', color: 'var(--danger)',
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </section>

      {/* RESULTS */}
      {(loading || results.length > 0) && (
        <section style={{ padding: '48px 48px 72px', maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800,
            marginBottom: 28,
          }}>
            {loading ? 'Generating your image…' : 'Generated Images'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {/* Loading placeholder */}
            {loading && (
              <div style={{
                borderRadius: 'var(--radius)', aspectRatio: '1',
                background: 'linear-gradient(90deg,var(--bg2) 25%,var(--border) 50%,var(--bg2) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s ease infinite',
              }} />
            )}

            {results.map((img, i) => (
              <div key={`${img.url}-${i}`} style={{
                borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 20px rgba(0,0,0,.06)',
                transition: 'transform var(--t), box-shadow var(--t)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(0,0,0,.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,.06)'; }}
              >
                <div style={{ position: 'relative' }}>
                  <img src={img.url} alt={img.prompt} style={{ width: '100%', display: 'block', aspectRatio: '1', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)',
                    color: 'white', fontSize: '.68rem', fontWeight: 700,
                    padding: '3px 10px', borderRadius: 50,
                  }}>
                    {PROVIDERS[img.provider].label}
                  </div>
                </div>
                <div style={{
                  padding: '12px 14px', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{
                    fontSize: '.76rem', color: 'var(--text2)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: '65%',
                  }} title={img.prompt}>{img.prompt}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { icon: '⬇️', title: 'Download', action: () => downloadImage(img.url, i) },
                      { icon: '🔗', title: 'Copy URL', action: () => navigator.clipboard.writeText(img.url) },
                    ].map(btn => (
                      <button key={btn.icon} onClick={btn.action} title={btn.title} style={{
                        width: 30, height: 30, borderRadius: '50%', background: 'var(--bg2)',
                        border: '1px solid var(--border)', cursor: 'pointer', fontSize: '.78rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background var(--t)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-light)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg2)')}
                      >{btn.icon}</button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EMPTY STATE */}
      {!loading && results.length === 0 && (
        <section style={{ padding: '72px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✦</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: 10 }}>
            Your canvas is empty
          </h2>
          <p style={{ color: 'var(--text2)', maxWidth: 400, margin: '0 auto' }}>
            Type a description above and hit Generate to create your first AI image. You have{' '}
            <strong style={{ color: 'var(--primary)' }}>{credits?.balance ?? 0} credits</strong> to use.
          </p>
        </section>
      )}

      <style>{`
        @keyframes shimmer {
          0%  { background-position: 200% 0; }
          100%{ background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
