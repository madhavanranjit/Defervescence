import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  async function sendOTP() {
    if (!phone) return
    setLoading(true)
    setError('')
    const formatted = phone.startsWith('+') ? phone : '+91' + phone
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
    if (error) setError(error.message)
    else setStep('otp')
    setLoading(false)
  }

  async function verifyOTP() {
    if (!otp) return
    setLoading(true)
    setError('')
    const formatted = phone.startsWith('+') ? phone : '+91' + phone
    const { error } = await supabase.auth.verifyOtp({
      phone: formatted, token: otp, type: 'sms'
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>🌡️</div>
          <h1 style={s.title}>Defer<span style={s.accent}>vescence</span></h1>
          <p style={s.tagline}>Track the fever. Watch it fall.</p>
        </div>

        {step === 'login' && <>
          <button onClick={signInWithGoogle} style={s.googleBtn}>
            <img src="https://www.google.com/favicon.ico" width="16" style={{ marginRight: 8 }} />
            Continue with Google
          </button>

          <div style={s.divider}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>or</span>
            <span style={s.dividerLine} />
          </div>

          <div style={s.inputRow}>
            <span style={s.prefix}>+91</span>
            <input
              style={s.input}
              type="tel"
              placeholder="Mobile number"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </div>

          <button onClick={sendOTP} style={s.mainBtn} disabled={loading || phone.length < 10}>
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </>}

        {step === 'otp' && <>
          <p style={s.hint}>OTP sent to +91 {phone}</p>
          <input
            style={{ ...s.input, width: '100%', textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.3em', marginBottom: '12px' }}
            type="number"
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value.slice(0, 6))}
          />
          <button onClick={verifyOTP} style={s.mainBtn} disabled={loading || otp.length < 6}>
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>
          <button onClick={() => setStep('login')} style={s.backBtn}>← Back</button>
        </>}

        {error && <p style={s.error}>{error}</p>}

        <p style={s.footer}>
          By continuing you agree to our terms of service
        </p>
      </div>
    </div>
  )
}

const s = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7f6f3', padding: '24px' },
  card: { background: '#ffffff', borderRadius: '24px', padding: '36px 28px', width: '100%', maxWidth: '380px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  logoWrap: { textAlign: 'center', marginBottom: '32px' },
  logoIcon: { fontSize: '2.5rem', marginBottom: '8px' },
  title: { fontFamily: 'Georgia,serif', fontSize: '2rem', color: '#1a1a1a', margin: '0 0 6px' },
  accent: { color: '#ff6b35', fontStyle: 'italic' },
  tagline: { fontSize: '0.7rem', color: '#999', letterSpacing: '0.12em', textTransform: 'uppercase' },
  googleBtn: { width: '100%', background: '#fff', color: '#1a1a1a', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '13px', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  divider: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  dividerLine: { flex: 1, height: '1px', background: '#e0e0e0' },
  dividerText: { fontSize: '0.72rem', color: '#999' },
  inputRow: { display: 'flex', alignItems: 'center', background: '#f7f6f3', border: '1px solid #e0e0e0', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden' },
  prefix: { padding: '12px 10px 12px 14px', color: '#999', fontSize: '0.85rem', borderRight: '1px solid #e0e0e0' },
  input: { flex: 1, background: 'none', border: 'none', padding: '12px', color: '#1a1a1a', fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace' },
  mainBtn: { width: '100%', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', marginTop: '4px' },
  backBtn: { width: '100%', background: 'none', border: 'none', color: '#999', fontSize: '0.8rem', cursor: 'pointer', marginTop: '12px' },
  hint: { fontSize: '0.75rem', color: '#999', textAlign: 'center', marginBottom: '16px' },
  error: { color: '#ef233c', fontSize: '0.75rem', textAlign: 'center', marginTop: '12px' },
  footer: { fontSize: '0.62rem', color: '#bbb', textAlign: 'center', marginTop: '24px', lineHeight: '1.6' },
}