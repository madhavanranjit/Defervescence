import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('login') // login | otp
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://defervescence.vercel.app',
    }
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
        <h1 style={s.title}>Defer<span style={s.accent}>vescence</span></h1>
        <p style={s.tagline}>Track the fever. Watch it fall.</p>

        {step === 'login' && <>
          <button onClick={signInWithGoogle} style={s.googleBtn}>
            <img src="https://www.google.com/favicon.ico" width="16" style={{marginRight:8}} />
            Continue with Google
          </button>

          <div style={s.divider}><span>or use mobile number</span></div>

          <div style={s.inputRow}>
            <span style={s.prefix}>+91</span>
            <input
              style={s.input}
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
            />
          </div>

          <button onClick={sendOTP} style={s.mainBtn} disabled={loading || phone.length < 10}>
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </>}

        {step === 'otp' && <>
          <p style={s.hint}>OTP sent to +91 {phone}</p>
          <input
            style={{...s.input, width:'100%', textAlign:'center', fontSize:'1.4rem', letterSpacing:'0.3em'}}
            type="number"
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value.slice(0,6))}
          />
          <button onClick={verifyOTP} style={s.mainBtn} disabled={loading || otp.length < 6}>
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>
          <button onClick={() => setStep('login')} style={s.backBtn}>← Back</button>
        </>}

        {error && <p style={s.error}>{error}</p>}
      </div>
    </div>
  )
}

const s = {
  page: {display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#0d0d0f',padding:'24px'},
  card: {background:'#16161a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'24px',padding:'36px 28px',width:'100%',maxWidth:'380px'},
  title: {fontFamily:'Georgia,serif',fontSize:'2rem',color:'#f0ede8',textAlign:'center',marginBottom:'6px'},
  accent: {color:'#ff6b35',fontStyle:'italic'},
  tagline: {fontSize:'0.7rem',color:'#6b6875',textAlign:'center',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:'32px'},
  googleBtn: {width:'100%',background:'#fff',color:'#111',border:'none',borderRadius:'12px',padding:'13px',fontSize:'0.85rem',fontWeight:'500',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'20px'},
  divider: {textAlign:'center',color:'#6b6875',fontSize:'0.7rem',letterSpacing:'0.1em',marginBottom:'20px',position:'relative'},
  inputRow: {display:'flex',alignItems:'center',background:'#1e1e24',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',marginBottom:'12px',overflow:'hidden'},
  prefix: {padding:'12px 10px 12px 14px',color:'#6b6875',fontSize:'0.85rem',borderRight:'1px solid rgba(255,255,255,0.07)'},
  input: {flex:1,background:'none',border:'none',padding:'12px',color:'#f0ede8',fontSize:'0.85rem',outline:'none',fontFamily:'monospace'},
  mainBtn: {width:'100%',background:'#ff6b35',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'0.85rem',fontWeight:'500',cursor:'pointer',marginTop:'4px'},
  backBtn: {width:'100%',background:'none',border:'none',color:'#6b6875',fontSize:'0.8rem',cursor:'pointer',marginTop:'12px'},
  hint: {fontSize:'0.75rem',color:'#6b6875',textAlign:'center',marginBottom:'16px'},
  error: {color:'#ef233c',fontSize:'0.75rem',textAlign:'center',marginTop:'12px'},
}