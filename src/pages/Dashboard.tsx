import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const PROVIDERS = {
  openai: {
    label: 'OpenAI DALL-E', color: '#10a37f',
    models: ['dall-e-3', 'dall-e-2'],
    sizes:  ['1024x1024', '1792x1024', '1024x1792', '512x512'],
  },
  stability: {
    label: 'Stability AI', color: '#7b4fe2',
    models: ['stable-diffusion-xl-1024-v1-0', 'stable-diffusion-v1-6'],
    sizes:  ['1024x1024', '896x1152', '768x768', '512x512'],
  },
  hf: {
    label: 'Hugging Face', color: '#ff9d00',
    models: ['stabilityai/stable-diffusion-xl-base-1.0', 'runwayml/stable-diffusion-v1-5', 'prompthero/openjourney'],
    sizes:  ['512x512', '768x768'],
  },
} as const

type Provider = keyof typeof PROVIDERS
const STYLES = ['Creative', 'Futurism', 'Steampunk', 'Gothic', 'Space', 'Photorealistic']

interface ResultImage { url: string; prompt: string; model: string; provider: Provider; id: string }

export default function Dashboard() {
  const { credits, refreshCredits } = useAuth()
  const [provider, setProvider] = useState<Provider>('openai')
  const [model,    setModel]    = useState(PROVIDERS.openai.models[0])
  const [size,     setSize]     = useState(PROVIDERS.openai.sizes[0])
  const [style,    setStyle]    = useState('Creative')
  const [prompt,   setPrompt]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [results,  setResults]  = useState<ResultImage[]>([])
  const [toast,    setToast]    = useState('')

  const switchProvider = (p: Provider) => { setProvider(p); setModel(PROVIDERS[p].models[0]); setSize(PROVIDERS[p].sizes[0]) }
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const generate = async () => {
    if (!prompt.trim()) { setError('Please enter a prompt.'); return }
    if ((credits?.balance ?? 0) < 1) { setError('No credits remaining. Please top up.'); return }
    setError(''); setLoading(true)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Not authenticated. Please sign in again.')
      const fullPrompt = style !== 'Creative' ? `${prompt.trim()}, ${style} style` : prompt.trim()
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: fullPrompt, model, provider, size }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`)
      setResults(prev => [...(json.images as string[]).map((url: string, i: number) => ({ url, prompt: fullPrompt, model, provider, id: `${Date.now()}-${i}` })), ...prev])
      await refreshCredits()
      showToast(`✦ Image generated! ${(credits?.balance ?? 1) - 1} credits left`)
    } catch (e: any) {
      setError(e.message ?? 'Generation failed.')
    } finally {
      setLoading(false)
    }
  }

  const noCredits  = (credits?.balance ?? 0) < 1
  const lowCredits = (credits?.balance ?? 0) <= 2 && !noCredits

  const selStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    appearance: 'none' as const, background: 'rgba(255,255,255,.85)',
    border: '1.5px solid var(--border)', borderRadius: 50,
    padding: '9px 34px 9px 16px', fontSize: '.8rem', fontWeight: 500,
    color: 'var(--text)', cursor: 'pointer', outline: 'none', ...extra,
  })

  return (
    <div style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg,#ede9fe 0%,#fce7f3 50%,#fef3c7 100%)', padding: '56px 24px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'#a78bfa', filter:'blur(72px)', opacity:.4, top:-100, left:-150, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', width:320, height:320, borderRadius:'50%', background:'#ec4899', filter:'blur(72px)', opacity:.4, top:'40%', right:-100, pointerEvents:'none' }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Credits badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.85)', backdropFilter:'blur(8px)', border:`1px solid ${noCredits?'rgba(239,68,68,.3)':lowCredits?'rgba(245,158,11,.3)':'rgba(124,58,237,.2)'}`, borderRadius:50, padding:'7px 18px', marginBottom:24, fontSize:'.82rem', fontWeight:700, color: noCredits?'var(--danger)':lowCredits?'#b45309':'var(--primary)' }}>
            <span>✦</span><span>{credits?.balance ?? 0} credits remaining</span>
            {(noCredits||lowCredits) && <Link to="/pricing" style={{ background:noCredits?'var(--danger)':'var(--accent)', color:'white', padding:'3px 10px', borderRadius:50, fontSize:'.72rem', marginLeft:4, fontWeight:700 }}>Top up</Link>}
          </div>

          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5vw,4.5rem)', fontWeight:900, lineHeight:1.05, letterSpacing:'-.03em', marginBottom:12 }}>
            <span style={{ background:'linear-gradient(135deg,var(--primary),var(--accent2))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Create anything</span><br/>
            <span style={{ WebkitTextStroke:'2px var(--text)', WebkitTextFillColor:'transparent' }}>with AI</span>
          </h1>

          {/* Provider tabs */}
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginBottom:18 }}>
            {(Object.keys(PROVIDERS) as Provider[]).map(p => (
              <button key={p} onClick={() => switchProvider(p)} style={{ padding:'8px 20px', borderRadius:50, fontWeight:700, fontSize:'.8rem', cursor:'pointer', border:`2px solid ${provider===p?PROVIDERS[p].color:'var(--border)'}`, background:provider===p?PROVIDERS[p].color:'rgba(255,255,255,.85)', color:provider===p?'white':'var(--text2)', transition:'all var(--t)', display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', display:'inline-block', background:provider===p?'rgba(255,255,255,.7)':PROVIDERS[p].color }}/>
                {PROVIDERS[p].label}
              </button>
            ))}
          </div>

          {/* Prompt box */}
          <div style={{ maxWidth:720, margin:'0 auto 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.96)', backdropFilter:'blur(16px)', border:`1.5px solid ${loading?'var(--primary)':'rgba(124,58,237,.2)'}`, borderRadius:28, padding:'8px 8px 8px 20px', boxShadow:'0 12px 48px rgba(124,58,237,.1)', transition:'border-color var(--t)' }}>
              <input value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!loading&&generate()} placeholder="A cyberpunk samurai in neon rain, 8K cinematic lighting…" disabled={loading} style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:'1rem', color:'var(--text)', padding:'10px 0' }}/>
              <button onClick={generate} disabled={loading||noCredits} className="btn-primary" style={{ borderRadius:20, padding:'12px 28px', fontSize:'.9rem' }}>
                {loading?<><div className="spinner"/>Generating…</>:'✦ Generate'}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display:'flex', alignItems:'center', gap:9, justifyContent:'center', flexWrap:'wrap' }}>
            <div style={{ position:'relative' }}>
              <select value={model} onChange={e=>setModel(e.target.value)} style={selStyle()}>
                {PROVIDERS[provider].models.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
              <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none', fontSize:'.7rem' }}>▾</span>
            </div>
            <div style={{ position:'relative' }}>
              <select value={size} onChange={e=>setSize(e.target.value)} style={selStyle()}>
                {PROVIDERS[provider].sizes.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none', fontSize:'.7rem' }}>▾</span>
            </div>
            {STYLES.map(s=>(
              <button key={s} onClick={()=>setStyle(s)} style={{ background:style===s?'var(--primary)':'rgba(255,255,255,.85)', color:style===s?'white':'var(--text2)', border:`1.5px solid ${style===s?'var(--primary)':'var(--border)'}`, borderRadius:50, padding:'9px 16px', fontSize:'.78rem', fontWeight:500, cursor:'pointer', transition:'all var(--t)' }}>{s}</button>
            ))}
          </div>

          {noCredits && <div style={{ marginTop:18, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:14, padding:'14px 20px', maxWidth:480, margin:'18px auto 0', fontSize:'.875rem', color:'var(--danger)' }}>You've used all your credits. <Link to="/pricing" style={{ fontWeight:700, color:'var(--danger)', textDecoration:'underline' }}>Buy more →</Link></div>}
          {error && <div style={{ marginTop:14, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:14, padding:'12px 18px', maxWidth:500, margin:'14px auto 0', fontSize:'.83rem', color:'var(--danger)' }}>⚠️ {error}</div>}
        </div>
      </section>

      {/* RESULTS */}
      <section style={{ padding:'44px 48px 72px', maxWidth:1200, margin:'0 auto' }}>
        {(loading||results.length>0) && (
          <>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:800, marginBottom:24 }}>{loading&&results.length===0?'Generating…':'Generated Images'}</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:18 }}>
              {loading && <div style={{ borderRadius:'var(--radius)', aspectRatio:'1', background:'linear-gradient(90deg,var(--bg2) 25%,var(--border) 50%,var(--bg2) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s ease infinite' }}/>}
              {results.map((img,i)=>(
                <div key={img.id} style={{ borderRadius:'var(--radius)', overflow:'hidden', background:'var(--surface)', border:'1px solid var(--border)', boxShadow:'0 4px 20px rgba(0,0,0,.06)', transition:'transform var(--t),box-shadow var(--t)' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-5px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 20px 48px rgba(0,0,0,.12)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='';(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 20px rgba(0,0,0,.06)'}}>
                  <div style={{ position:'relative' }}>
                    <img src={img.url} alt={img.prompt} style={{ width:'100%', display:'block', aspectRatio:'1', objectFit:'cover' }}/>
                    <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,.65)', backdropFilter:'blur(8px)', color:'white', fontSize:'.68rem', fontWeight:700, padding:'3px 10px', borderRadius:50 }}>{PROVIDERS[img.provider].label}</div>
                  </div>
                  <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:'.75rem', color:'var(--text2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'62%' }} title={img.prompt}>{img.prompt}</div>
                    <div style={{ display:'flex', gap:6 }}>
                      {[{icon:'⬇️',fn:()=>{const a=document.createElement('a');a.href=img.url;a.download=`artmind-${Date.now()}-${i}.png`;document.body.appendChild(a);a.click();document.body.removeChild(a);showToast('⬇️ Downloading!')}},{icon:'🔗',fn:()=>{navigator.clipboard.writeText(img.url);showToast('🔗 Copied!')}},{icon:'♻️',fn:()=>{setPrompt(img.prompt);window.scrollTo({top:0,behavior:'smooth'})}}].map(btn=>(
                        <button key={btn.icon} onClick={btn.fn} style={{ width:30,height:30,borderRadius:'50%',background:'var(--bg2)',border:'1px solid var(--border)',cursor:'pointer',fontSize:'.78rem',display:'flex',alignItems:'center',justifyContent:'center',transition:'background var(--t)' }}
                          onMouseEnter={e=>(e.currentTarget.style.background='var(--primary-light)')}
                          onMouseLeave={e=>(e.currentTarget.style.background='var(--bg2)')}>{btn.icon}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {!loading&&results.length===0&&(
          <div style={{ textAlign:'center', padding:'64px 24px' }}>
            <div style={{ fontSize:'3rem', marginBottom:16 }}>✦</div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:800, marginBottom:10 }}>Your canvas is empty</h2>
            <p style={{ color:'var(--text2)', maxWidth:380, margin:'0 auto' }}>Type a description above and hit Generate. You have <strong style={{ color:'var(--primary)' }}>{credits?.balance??0} credits</strong> to use.</p>
          </div>
        )}
      </section>

      {toast&&<div style={{ position:'fixed',bottom:32,left:'50%',transform:'translateX(-50%)',background:'var(--text)',color:'white',padding:'11px 24px',borderRadius:50,fontSize:'.83rem',fontWeight:600,boxShadow:'0 8px 24px rgba(0,0,0,.2)',zIndex:9000,whiteSpace:'nowrap',animation:'fadeUp .3s ease' }}>{toast}</div>}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}
