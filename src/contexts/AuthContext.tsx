import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, type Profile, type Credits } from '../lib/supabase'

// ── Types ──────────────────────────────────────────────────
interface AuthContextValue {
  user:         User | null
  session:      Session | null
  profile:      Profile | null
  credits:      Credits | null
  loading:      boolean
  signUp:       (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signIn:       (email: string, password: string) => Promise<{ error: Error | null }>
  signInGoogle: () => Promise<{ error: Error | null }>
  signOut:      () => Promise<void>
  refreshCredits: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ── Provider ───────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User    | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [credits, setCredits] = useState<Credits | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Fetch profile + credits for a given user ─────────────
  const fetchUserData = useCallback(async (userId: string) => {
    const [{ data: profileData }, { data: creditsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('credits').select('*').eq('user_id', userId).single(),
    ])
    setProfile(profileData ?? null)
    setCredits(creditsData ?? null)
  }, [])

  const refreshCredits = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', user.id)
      .single()
    setCredits(data ?? null)
  }, [user])

  // ── Bootstrap session ─────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchUserData(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) await fetchUserData(session.user.id)
        else { setProfile(null); setCredits(null) }
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [fetchUserData])

  // ── Auth methods ──────────────────────────────────────────
  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    })
    return { error: error as Error | null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signInGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setCredits(null)
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, credits, loading,
      signUp, signIn, signInGoogle, signOut, refreshCredits,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
