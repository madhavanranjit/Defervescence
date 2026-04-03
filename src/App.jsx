import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

const isNative = () => typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [skipLogin, setSkipLogin] = useState(
    localStorage.getItem('skipLogin') === 'true'
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogleNative() {
    try {
      const { GoogleAuth } = await import('@southdevs/capacitor-google-auth')
      await GoogleAuth.initialize()
      const googleUser = await GoogleAuth.signIn()
      const idToken = googleUser.authentication.idToken
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      })
      if (error) throw error
    } catch (e) {
      console.error('Google sign-in error:', e)
    }
  }

  function handleSkip() {
    localStorage.setItem('skipLogin', 'true')
    setSkipLogin(true)
  }

  function handleSignOut() {
    localStorage.removeItem('skipLogin')
    localStorage.removeItem('guestPatients')
    localStorage.removeItem('activePatientId')
    setSkipLogin(false)
    setSession(null)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f6f3', color: '#ff6b35', fontFamily: 'monospace' }}>
      Loading…
    </div>
  )

  if (session) return <Dashboard session={session} onSignOut={handleSignOut} />
  if (skipLogin) return <Dashboard session={null} onSignOut={handleSignOut} />

  return <Auth
    onSkip={handleSkip}
    onNativeGoogleLogin={isNative() ? signInWithGoogleNative : null}
  />
}