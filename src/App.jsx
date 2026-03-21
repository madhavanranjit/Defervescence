import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Handle deep link only on native Android
    const setupDeepLink = async () => {
      try {
        const { App: CapApp } = await import('@capacitor/app')
        const { isNativePlatform } = await import('@capacitor/core')
        if (isNativePlatform()) {
          CapApp.addListener('appUrlOpen', async ({ url }) => {
            if (url.includes('login-callback')) {
              const hash = url.split('#')[1]
              if (hash) {
                const params = new URLSearchParams(hash)
                const access_token = params.get('access_token')
                const refresh_token = params.get('refresh_token')
                if (access_token) {
                  await supabase.auth.setSession({ access_token, refresh_token })
                }
              }
            }
          })
        }
      } catch (e) {
        console.log('Not native platform')
      }
    }

    setupDeepLink()

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f6f3', color: '#ff6b35', fontFamily: 'monospace' }}>
      Loading…
    </div>
  )

  return session ? <Dashboard session={session} /> : <Auth />
}