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
    // Check for OAuth tokens in URL hash (Android redirect)
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (access_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ data }) => {
          if (data.session) {
            setSession(data.session)
            window.location.hash = ''
          }
          setLoading(false)
        })
        return
      }
    }

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
      const { Browser } = await import('@capacitor/browser')
      const { data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://defervescence.vercel.app',
          skipBrowserRedirect: true
        }
      })
      if (data?.url) await Browser.open({ url: data.url })
    } catch (e) {
      console.log('Native Google login error:', e)
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