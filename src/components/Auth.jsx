import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth({ onSkip, onNativeGoogleLogin }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    if (onNativeGoogleLogin) {
      await onNativeGoogleLogin()
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' }
      }
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.logoWrap}>
          <div style={s.logoIcon}>🌡️</div>
          <h1 style={s.title}>Defer<span style={s.accent}>vescence</span></h1>
          <p style={s.tagline}>Smart Fever Tracker</p>
        </div>

        <button onClick={signInWithGoogle} style={s.googleBtn} disabled={loading}>
          <img src="https://www.google.com/favicon.ico" width="16" style={{ marginRight: 8 }} />
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>
        <p style={s.benefitText}>☁️ Cloud sync · 5 patients · Access anywhere</p>

        <div style={s.divider}>
          <span style={s.dividerLine} />
          <span style={s.dividerText}>or</span>
          <span style={s.dividerLine} />
        </div>

        <button onClick={onSkip} style={s.skipBtn}>
          Use without account
        </button>
        <p style={s.skipNote}>📱 Data stays on this phone only · No cloud sync</p>

        {error && <p style={s.error}>{error}</p>}

        <p style={s.footer}>By continuing you agree to our terms of service</p>
      </div>
    </div>
  )
}

const s = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7f6f3', padding: '24px' },
  card: { background: '#ffffff', borderRadius: '24px', padding: '36px 28px', width: '100%', maxWidth: '380px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  logoWrap: { textAlign: 'center', marginBottom: '40px' },
  logoIcon: { fontSize: '2.5rem', marginBottom: '8px' },
  title: { fontFamily: 'Georgia,serif', fontSize: '2rem', color: '#1a1a1a', margin: '0 0 6px' },
  accent: { color: '#ff6b35', fontStyle: 'italic' },
  tagline: { fontSize: '0.7rem', color: '#999', letterSpacing: '0.12em', textTransform: 'uppercase' },
  googleBtn: { width: '100%', background: '#fff', color: '#1a1a1a', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '13px', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  benefitText: { fontSize: '0.65rem', color: '#999', textAlign: 'center', marginBottom: '20px' },
  divider: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  dividerLine: { flex: 1, height: '1px', background: '#e0e0e0' },
  dividerText: { fontSize: '0.72rem', color: '#999' },
  skipBtn: { width: '100%', background: '#f7f6f3', color: '#1a1a1a', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '13px', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', marginBottom: '8px' },
  skipNote: { fontSize: '0.65rem', color: '#999', textAlign: 'center', marginBottom: '16px' },
  error: { color: '#ef233c', fontSize: '0.75rem', textAlign: 'center', marginTop: '12px' },
  footer: { fontSize: '0.62rem', color: '#bbb', textAlign: 'center', marginTop: '16px', lineHeight: '1.6' },
}
