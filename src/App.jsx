import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

const isNative = () => {
  return window.Capacitor !== undefined && window.Capacitor.isNativePlatform()
}

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
    })

    // Handle deep link on native Android
    if (isNative()) {
      setupDeepLink()
    }

    return () => subscription.unsubscribe()
  }, [])

  async function setupDeepLink() {
    try {
      const { App: CapApp } = await import('@capacitor/app')
      CapApp.addListener('appUrlOpen', async ({ url }) => {
        if (url.includes('login-callback') || url.includes('access_token')) {
          const hashPart = url.split('#')[1] || url.split('?')[1] || ''
          const params = new URLSearchParams(hashPart)
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          if (access_token) {
            await supabase.auth.setSession({ access_token, refresh_token })
          }
        }
      })
    } catch (e) {
      console.log('Deep link setup failed:', e)
    }
  }

  async function signInWithGoogleNative() {
    try {
      const { Browser } = await import('@capacitor/browser')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.defervescence.app://login-callback',
          skipBrowserRedirect: true
        }
      })
      if (data?.url) {
        await Browser.open({ url: data.url })
      }
    } catch (e) {
      console.log('Native Google login failed:', e)
    }
  }

  function handleSkip() {
    localStorage.setItem('skipLogin', 'true')
    setSkipLogin(true)
  }

  function handleSignOut() {
    localStorage.removeItem('skipLogin')
    setSkipLogin(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f6f3', color: '#ff6b35', fontFamily: 'monospace' }}>
      Loading…
    </div>
  )

  if (session) return <Dashboard session={session} onSignOut={handleSignOut} />
  if (skipLogin) return <Dashboard session={null} onSignOut={handleSignOut} />

  return <Auth onSkip={handleSkip} onNativeGoogleLogin={isNative() ? signInWithGoogleNative : null} />
}