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
    // Try to restore saved session first
    const savedSession = localStorage.getItem('defervescence-session')
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        supabase.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token
        }).then(({ data }) => {
          if (data.session) setSession(data.session)
          setLoading(false)
        })
      } catch {
        localStorage.removeItem('defervescence-session')
        setLoading(false)
      }
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        localStorage.setItem('defervescence-session', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        }))
      } else {
        localStorage.removeItem('defervescence-session')
      }
      setLoading(false)
    })

    // Listen for browser close after Google login
    const setupBrowserListener = async () => {
      try {
        const { Browser } = await import('@capacitor/browser')
        await Browser.addListener('browserFinished', async () => {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            setSession(session)
            localStorage.setItem('defervescence-session', JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token
            }))
          }
        })
      } catch(e) {
        console.log('Browser listener error:', e)
      }
    }

    if (isNative()) setupBrowserListener()

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogleNative() {
    try {
      const { Browser } = await import('@capacitor/browser')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://defervescence.vercel.app',
          skipBrowserRedirect: true
        }
      })
      if (error) throw error
      if (data?.url) {
        await Browser.open({
          url: data.url,
          windowName: '_self',
          presentationStyle: 'popover'
        })
      }
    } catch (e) {
      console.log('Google login error:', e)
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
    localStorage.removeItem('defervescence-session')
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