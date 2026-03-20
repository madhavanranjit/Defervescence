import { useState } from 'react'
import { supabase } from '../supabase'

export default function SetupTab({ session }) {
  const [key, setKey] = useState(localStorage.getItem('openaiKey') || '')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(!!localStorage.getItem('openaiKey'))

  function saveKey() {
    if (!key.startsWith('sk-')) { alert('Key should start with sk-'); return }
    localStorage.setItem('openaiKey', key)
    setSaved(true)
  }

  function removeKey() {
    localStorage.removeItem('openaiKey')
    setKey('')
    setSaved(false)
  }

  return (
    <div style={{ padding: '8px 16px 40px' }}>
      <div style={s.card}>
        <p style={s.label}>Logged in as</p>
        <p style={s.value}>{session.user.email || session.user.phone}</p>
        <button onClick={() => supabase.auth.signOut()} style={s.signOutBtn}>Sign out</button>
      </div>

      <div style={s.card}>
        <p style={s.cardTitle}>OpenAI API Key</p>
        <p style={s.hint}>Used to parse your voice/text readings. Stored only on this device.</p>
        <div style={s.inputRow}>
          <input type={showKey ? 'text' : 'password'} value={key}
            onChange={e => { setKey(e.target.value); setSaved(false) }}
            placeholder="sk-..." style={s.input} autoComplete="off" spellCheck="false" />
          <button onClick={() => setShowKey(!showKey)} style={s.eyeBtn}>{showKey ? '🙈' : '👁'}</button>
        </div>
        {saved
          ? <div style={s.savedBadge}>✓ Key saved on this device</div>
          : <button onClick={saveKey} style={s.saveBtn}>Save Key</button>}
        {saved && <button onClick={removeKey} style={s.removeBtn}>Remove key</button>}
        <p style={s.costNote}>Each reading costs ~$0.00003. Your credits will last thousands of readings.</p>
      </div>

      <div style={s.card}>
        <p style={s.cardTitle}>About</p>
        <div style={s.infoRow}><span style={s.infoLabel}>App</span><span style={s.infoVal}>Defervescence</span></div>
        <div style={s.infoRow}><span style={s.infoLabel}>Version</span><span style={s.infoVal}>0.1.0</span></div>
        <div style={s.infoRow}><span style={s.infoLabel}>Tagline</span><span style={s.infoVal}>Track the fever. Watch it fall.</span></div>
      </div>
    </div>
  )
}

const s = {
  card: { background: '#16161a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '18px 16px', marginBottom: '13px' },
  cardTitle: { fontSize: '0.85rem', color: '#f0ede8', fontWeight: '500', marginBottom: '6px' },
  label: { fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6875', marginBottom: '4px' },
  value: { fontSize: '0.85rem', color: '#ff6b35', marginBottom: '14px' },
  hint: { fontSize: '0.7rem', color: '#6b6875', lineHeight: '1.6', marginBottom: '14px' },
  inputRow: { display: 'flex', alignItems: 'center', background: '#1e1e24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', marginBottom: '10px', overflow: 'hidden' },
  input: { flex: 1, background: 'none', border: 'none', padding: '12px', color: '#f0ede8', fontSize: '0.78rem', outline: 'none', fontFamily: 'monospace' },
  eyeBtn: { background: 'none', border: 'none', padding: '12px', cursor: 'pointer', fontSize: '0.85rem' },
  saveBtn: { width: '100%', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' },
  savedBadge: { textAlign: 'center', color: '#06d6a0', fontSize: '0.75rem', padding: '10px', background: 'rgba(6,214,160,0.06)', borderRadius: '8px', border: '1px solid rgba(6,214,160,0.2)', marginBottom: '8px' },
  removeBtn: { width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '11px', color: '#6b6875', fontSize: '0.72rem', cursor: 'pointer', marginTop: '6px' },
  costNote: { fontSize: '0.65rem', color: '#6b6875', marginTop: '10px', lineHeight: '1.6' },
  signOutBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 16px', color: '#6b6875', fontSize: '0.72rem', cursor: 'pointer' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  infoLabel: { fontSize: '0.7rem', color: '#6b6875' },
  infoVal: { fontSize: '0.7rem', color: '#f0ede8' },
}