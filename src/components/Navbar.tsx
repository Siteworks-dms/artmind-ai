import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, profile, credits, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      height: 'var(--nav-h)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px',
      background: 'rgba(250,249,247,0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 1px 0 var(--border)',
    }}>
      {/* Logo */}
      <Link to="/" style={{
        fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700,
        background: 'linear-gradient(135deg,var(--primary),var(--accent2))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        ArtMind AI
      </Link>

      {/* Desktop nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link to="/" style={{
          fontSize: '.875rem', fontWeight: 500,
          color: isActive('/') ? 'var(--primary)' : 'var(--text2)',
          transition: 'color var(--t)',
        }}>Home</Link>

        {user && (
          <Link to="/dashboard" style={{
            fontSize: '.875rem', fontWeight: 500,
            color: isActive('/dashboard') ? 'var(--primary)' : 'var(--text2)',
            transition: 'color var(--t)',
          }}>Generate</Link>
        )}

        {user && (
          <Link to="/gallery" style={{
            fontSize: '.875rem', fontWeight: 500,
            color: isActive('/gallery') ? 'var(--primary)' : 'var(--text2)',
            transition: 'color var(--t)',
          }}>My Gallery</Link>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            {/* Credits badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: credits && credits.balance <= 2
                ? 'rgba(239,68,68,.1)' : 'rgba(124,58,237,.08)',
              color: credits && credits.balance <= 2
                ? 'var(--danger)' : 'var(--primary)',
              padding: '6px 14px', borderRadius: 50,
              fontSize: '.8rem', fontWeight: 700,
              border: `1px solid ${credits && credits.balance <= 2
                ? 'rgba(239,68,68,.2)' : 'rgba(124,58,237,.15)'}`,
            }}>
              <span>✦</span>
              <span>{credits?.balance ?? 0} credits</span>
            </div>

            {/* Top-up button */}
            <Link to="/pricing" style={{
              background: 'var(--primary)', color: 'white',
              padding: '8px 18px', borderRadius: 50,
              fontSize: '.82rem', fontWeight: 600,
              transition: 'background var(--t)',
            }}>
              + Buy Credits
            </Link>

            {/* Avatar / menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg,var(--primary),var(--accent2))',
                  color: 'white', fontWeight: 700, fontSize: '.85rem',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {profile?.full_name
                  ? profile.full_name.charAt(0).toUpperCase()
                  : user.email?.charAt(0).toUpperCase()}
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: 'absolute', top: 44, right: 0, width: 200,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 16px 48px rgba(0,0,0,.1)',
                    overflow: 'hidden', zIndex: 100,
                  }}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text)' }}>
                      {profile?.full_name || 'User'}
                    </div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: 2 }}>
                      {user.email}
                    </div>
                  </div>
                  {[
                    { label: 'Dashboard',   path: '/dashboard' },
                    { label: 'My Gallery',  path: '/gallery'   },
                    { label: 'Profile',     path: '/profile'   },
                    { label: 'Buy Credits', path: '/pricing'   },
                  ].map(item => (
                    <Link
                      key={item.path} to={item.path}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'block', padding: '11px 16px',
                        fontSize: '.875rem', color: 'var(--text2)',
                        transition: 'background var(--t)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={handleSignOut}
                      style={{
                        width: '100%', padding: '11px 16px', textAlign: 'left',
                        fontSize: '.875rem', color: 'var(--danger)',
                        cursor: 'pointer', background: 'none', border: 'none',
                        transition: 'background var(--t)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/auth?mode=signin" style={{
              fontSize: '.875rem', fontWeight: 500, color: 'var(--text2)',
              padding: '8px 16px', transition: 'color var(--t)',
            }}>
              Sign in
            </Link>
            <Link to="/auth?mode=signup" className="btn-primary" style={{
              padding: '9px 22px', fontSize: '.875rem', borderRadius: 50,
              textDecoration: 'none',
            }}>
              Get Started Free
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
