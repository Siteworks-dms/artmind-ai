import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type Generation } from '../lib/supabase'

const PROVIDERS = {
  openai:    { label: 'OpenAI DALL-E', color: '#10a37f' },
  stability: { label: 'Stability AI',  color: '#7b4fe2' },
  hf:        { label: 'Hugging Face',  color: '#ff9d00' },
}

const FILTERS = ['All', 'OpenAI DALL-E', 'Stability AI', 'Hugging Face']
const SORTS   = ['Newest first', 'Oldest first']

export default function GalleryPage() {
  const { user } = useAuth()

  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('All')
  const [sort,        setSort]        = useState('Newest first')
  const [search,      setSearch]      = useState('')
  const [selected,    setSelected]    = useState<string | null>(null)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [toast,       setToast]       = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const fetchGenerations = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) setGenerations(data)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchGenerations() }, [fetchGenerations])

  // ── Filter + search + sort ────────────────────────────
  const filtered = generations
    .filter(g => {
      if (filter === 'All') return true
      const providerLabel = PROVIDERS[g.provider as keyof typeof PROVIDERS]?.label ?? g.provider
      return providerLabel === filter
    })
    .filter(g => search === '' || g.prompt.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'Newest first') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

  // ── Delete ────────────────────────────────────────────
  const deleteGeneration = async (id: string) => {
    if (!confirm('Delete this image from your history?')) return
    setDeleting(id)
    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (!error) {
      setGenerations(prev => prev.filter(g => g.id !== id))
      if (selected === id) setSelected(null)
      showToast('🗑️ Image removed from history')
    }
    setDeleting(null)
  }

  // ── Download ──────────────────────────────────────────
  const downloadImage = (url: string, prompt: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `artmind-${Date.now()}.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    showToast('⬇️ Download started!')
  }

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    showToast('📋 Prompt copied!')
  }

  const selectedImage = selected ? generations.find(g => g.id === selected) : null

  // ── Stats ─────────────────────────────────────────────
  const stats = {
    total:     generations.length,
    openai:    generations.filter(g => g.provider === 'openai').length,
    stability: generations.filter(g => g.provider === 'stability').length,
    hf:        generations.filter(g => g.provider === 'hf').length,
  }

  return (
    <div style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── HEADER ──────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg,#ede9fe 0%,#fce7f3 60%,#fef3c7 100%)',
        padding: '48px 64px 40px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'#a78bfa', filter:'blur(80px)', opacity:.35, top:-150, left:-100, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'#ec4899', filter:'blur:80px', opacity:.25, bottom:-100, right:-50, pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ fontSize:'.75rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--primary)', marginBottom:10 }}>Your Gallery</div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.8rem,4vw,3rem)', fontWeight:900, lineHeight:1.1 }}>
                My Generated Images
              </h1>
              <p style={{ color:'var(--text2)', marginTop:8, fontSize:'.95rem' }}>
                {generations.length} image{generations.length !== 1 ? 's' : ''} generated so far
              </p>
            </div>
            <Link to="/dashboard" className="btn-primary" style={{ textDecoration:'none', padding:'12px 28px' }}>
              ✦ Generate more
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display:'flex', gap:16, marginTop:32, flexWrap:'wrap' }}>
            {[
              { label:'Total images',  value:stats.total,     color:'var(--primary)' },
              { label:'OpenAI DALL-E', value:stats.openai,    color:'#10a37f' },
              { label:'Stability AI',  value:stats.stability, color:'#7b4fe2' },
              { label:'Hugging Face',  value:stats.hf,        color:'#ff9d00' },
            ].map(s => (
              <div key={s.label} style={{
                background:'rgba(255,255,255,.8)', backdropFilter:'blur(8px)',
                border:'1px solid rgba(255,255,255,.6)',
                borderRadius:'var(--radius)', padding:'14px 20px', minWidth:120,
              }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:900, color:s.color, lineHeight:1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize:'.75rem', color:'var(--text2)', marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILTERS ─────────────────────────────────── */}
      <div style={{
        padding:'20px 64px', background:'var(--surface)',
        borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
      }}>
        {/* Search */}
        <div style={{ position:'relative', flex:1, minWidth:200, maxWidth:360 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search prompts…"
            style={{
              width:'100%', padding:'9px 16px 9px 38px',
              border:'1.5px solid var(--border)', borderRadius:50,
              fontSize:'.875rem', background:'var(--bg)', outline:'none',
              color:'var(--text)', transition:'border-color var(--t)',
            }}
            onFocus={e => e.currentTarget.style.borderColor='var(--primary)'}
            onBlur={e => e.currentTarget.style.borderColor='var(--border)'}
          />
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:'.85rem' }}>🔍</span>
          {search && (
            <button onClick={() => setSearch('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:'.8rem', background:'none', border:'none', cursor:'pointer' }}>✕</button>
          )}
        </div>

        {/* Provider filter */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'8px 18px', borderRadius:50, fontSize:'.8rem', fontWeight:600,
              cursor:'pointer', transition:'all var(--t)',
              background: filter === f ? 'var(--primary)' : 'var(--bg2)',
              color: filter === f ? 'white' : 'var(--text2)',
              border: `1.5px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
            }}>{f}</button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ position:'relative', marginLeft:'auto' }}>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{
            appearance:'none', background:'var(--bg2)', border:'1.5px solid var(--border)',
            borderRadius:50, padding:'9px 34px 9px 16px', fontSize:'.8rem',
            fontWeight:500, color:'var(--text)', cursor:'pointer', outline:'none',
          }}>
            {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:'.7rem', pointerEvents:'none' }}>▾</span>
        </div>

        {/* Result count */}
        <div style={{ fontSize:'.8rem', color:'var(--text3)', whiteSpace:'nowrap' }}>
          {filtered.length} of {generations.length}
        </div>
      </div>

      {/* ── GRID ────────────────────────────────────── */}
      <div style={{ padding:'32px 64px 72px', maxWidth:1400, margin:'0 auto' }}>

        {/* Loading */}
        {loading && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
            {Array.from({length:8}).map((_,i) => (
              <div key={i} style={{
                borderRadius:'var(--radius)', aspectRatio:'1',
                background:'linear-gradient(90deg,var(--bg2) 25%,var(--border) 50%,var(--bg2) 75%)',
                backgroundSize:'200% 100%', animation:'shimmer 1.4s ease infinite',
              }}/>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && generations.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 24px' }}>
            <div style={{ fontSize:'4rem', marginBottom:16 }}>🎨</div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:800, marginBottom:12 }}>
              No images yet
            </h2>
            <p style={{ color:'var(--text2)', maxWidth:360, margin:'0 auto 28px', lineHeight:1.7 }}>
              You haven't generated any images yet. Head to the dashboard and create your first masterpiece!
            </p>
            <Link to="/dashboard" className="btn-primary" style={{ textDecoration:'none' }}>
              ✦ Start generating
            </Link>
          </div>
        )}

        {/* No results from filter */}
        {!loading && generations.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 24px' }}>
            <div style={{ fontSize:'2rem', marginBottom:12 }}>🔍</div>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:700, marginBottom:8 }}>
              No results found
            </h3>
            <p style={{ color:'var(--text2)', marginBottom:20 }}>Try a different search or filter.</p>
            <button onClick={() => { setSearch(''); setFilter('All') }} className="btn-ghost">
              Clear filters
            </button>
          </div>
        )}

        {/* Image grid */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',
            gap:16,
          }}>
            {filtered.map(gen => (
              <div
                key={gen.id}
                onClick={() => setSelected(gen.id)}
                style={{
                  borderRadius:'var(--radius)', overflow:'hidden',
                  background:'var(--surface)', border:'1px solid var(--border)',
                  cursor:'pointer', position:'relative',
                  boxShadow:'0 2px 12px rgba(0,0,0,.06)',
                  transition:'transform var(--t), box-shadow var(--t)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(0,0,0,.12)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = ''
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,.06)'
                }}
              >
                {/* Image */}
                {gen.image_url ? (
                  <img
                    src={gen.image_url} alt={gen.prompt}
                    style={{ width:'100%', aspectRatio:'1', objectFit:'cover', display:'block' }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{
                    width:'100%', aspectRatio:'1',
                    background:'linear-gradient(135deg,var(--hero-a),var(--hero-b))',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'2rem',
                  }}>✦</div>
                )}

                {/* Provider badge */}
                <div style={{
                  position:'absolute', top:10, left:10,
                  background:'rgba(0,0,0,.65)', backdropFilter:'blur(8px)',
                  color:'white', fontSize:'.65rem', fontWeight:700,
                  padding:'3px 9px', borderRadius:50,
                }}>
                  {PROVIDERS[gen.provider as keyof typeof PROVIDERS]?.label ?? gen.provider}
                </div>

                {/* Delete button */}
                <button
                  onClick={e => { e.stopPropagation(); deleteGeneration(gen.id) }}
                  disabled={deleting === gen.id}
                  style={{
                    position:'absolute', top:10, right:10,
                    width:28, height:28, borderRadius:'50%',
                    background:'rgba(0,0,0,.6)', backdropFilter:'blur(8px)',
                    color:'white', fontSize:'.75rem', border:'none', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    opacity:0, transition:'opacity var(--t)',
                  }}
                  className="delete-btn"
                >
                  {deleting === gen.id ? '…' : '🗑️'}
                </button>

                {/* Footer */}
                <div style={{ padding:'10px 12px' }}>
                  <div style={{
                    fontSize:'.76rem', color:'var(--text2)',
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    marginBottom:4,
                  }} title={gen.prompt}>{gen.prompt}</div>
                  <div style={{ fontSize:'.7rem', color:'var(--text3)' }}>
                    {new Date(gen.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── LIGHTBOX ────────────────────────────────── */}
      {selectedImage && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.85)',
            backdropFilter:'blur(8px)', zIndex:9000,
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:'var(--surface)', borderRadius:'var(--radius-lg)',
              overflow:'hidden', maxWidth:700, width:'100%',
              boxShadow:'0 32px 80px rgba(0,0,0,.4)',
              animation:'fadeUp .3s ease',
            }}
          >
            {selectedImage.image_url && (
              <img
                src={selectedImage.image_url}
                alt={selectedImage.prompt}
                style={{ width:'100%', display:'block', maxHeight:'60vh', objectFit:'contain', background:'#000' }}
              />
            )}
            <div style={{ padding:24 }}>
              {/* Provider + date */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <span style={{
                  background:`rgba(${selectedImage.provider === 'openai' ? '16,163,127' : selectedImage.provider === 'stability' ? '123,79,226' : '255,157,0'},.1)`,
                  color: PROVIDERS[selectedImage.provider as keyof typeof PROVIDERS]?.color,
                  padding:'3px 10px', borderRadius:50, fontSize:'.72rem', fontWeight:700,
                }}>
                  {PROVIDERS[selectedImage.provider as keyof typeof PROVIDERS]?.label}
                </span>
                <span style={{ fontSize:'.75rem', color:'var(--text3)' }}>
                  {new Date(selectedImage.created_at).toLocaleString()}
                </span>
              </div>

              {/* Model */}
              <div style={{ fontSize:'.78rem', color:'var(--text3)', fontFamily:'var(--font-mono)', marginBottom:12 }}>
                {selectedImage.model} · {selectedImage.size}
              </div>

              {/* Prompt */}
              <div style={{
                background:'var(--bg2)', borderRadius:10,
                padding:'12px 14px', fontSize:'.875rem',
                color:'var(--text)', lineHeight:1.6, marginBottom:20,
              }}>
                {selectedImage.prompt}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {selectedImage.image_url && (
                  <button
                    onClick={() => downloadImage(selectedImage.image_url!, selectedImage.prompt)}
                    className="btn-primary"
                    style={{ padding:'10px 20px', fontSize:'.875rem' }}
                  >
                    ⬇️ Download
                  </button>
                )}
                <button
                  onClick={() => copyPrompt(selectedImage.prompt)}
                  className="btn-ghost"
                  style={{ padding:'10px 20px', fontSize:'.875rem' }}
                >
                  📋 Copy prompt
                </button>
                <Link
                  to={`/dashboard?prompt=${encodeURIComponent(selectedImage.prompt)}`}
                  className="btn-ghost"
                  style={{ textDecoration:'none', padding:'10px 20px', fontSize:'.875rem' }}
                  onClick={() => setSelected(null)}
                >
                  ♻️ Regenerate
                </Link>
                <button
                  onClick={() => { deleteGeneration(selectedImage.id); setSelected(null) }}
                  style={{
                    padding:'10px 20px', fontSize:'.875rem',
                    background:'rgba(239,68,68,.08)', color:'var(--danger)',
                    border:'1px solid rgba(239,68,68,.2)', borderRadius:50,
                    cursor:'pointer', marginLeft:'auto',
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setSelected(null)}
            style={{
              position:'absolute', top:20, right:20,
              width:40, height:40, borderRadius:'50%',
              background:'rgba(255,255,255,.15)', color:'white',
              fontSize:'1.1rem', border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >✕</button>
        </div>
      )}

      {/* ── TOAST ───────────────────────────────────── */}
      {toast && (
        <div style={{
          position:'fixed', bottom:32, left:'50%', transform:'translateX(-50%)',
          background:'var(--text)', color:'white', padding:'11px 24px',
          borderRadius:50, fontSize:'.83rem', fontWeight:600,
          boxShadow:'0 8px 24px rgba(0,0,0,.2)', zIndex:9999,
          whiteSpace:'nowrap', animation:'fadeUp .3s ease',
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .delete-btn { opacity: 0 !important; }
        div:hover > .delete-btn { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
