import { useState, useRef } from 'react'
import { supabase } from '../supabase'

export default function LogTab({ session, creditsData }) {
  const [isRec, setIsRec] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsed, setParsed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualText, setManualText] = useState('')
  const [unit, setUnit] = useState(localStorage.getItem('preferredUnit') || 'F')
  const transcriptRef = useRef('')

  function saveUnit(u) {
    setUnit(u)
    localStorage.setItem('preferredUnit', u)
  }

  function startRec() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Use Chrome for voice input'); return }
    const recognition = new SR()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onstart = () => {
      setIsRec(true)
      setTranscript('')
      transcriptRef.current = ''
      setParsed(null)
      setSaved(false)
    }
    recognition.onresult = e => {
      let t = ''
      for (let r of e.results) t += r[0].transcript
      setTranscript(t)
      transcriptRef.current = t
    }
    recognition.onend = () => {
      setIsRec(false)
      if (transcriptRef.current) doParse(transcriptRef.current)
    }
    recognition.start()
  }

  async function doParse(text) {
    setLoading(true)
    setParsed(null)
    setSaved(false)
    const now = new Date()
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const localTime = now.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true })
    const localDate = now.toLocaleDateString('en-US', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric' })
    try {
      const res = await fetch('https://defervescence.vercel.app/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, localDate, localTime, preferredUnit: unit })
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      setParsed(result)
    } catch (e) {
      alert('Could not parse. Try again.')
    }
    setLoading(false)
  }

  async function saveReading() {
    if (!parsed) return
    const { allowed } = creditsData ? await creditsData.useCredit() : { allowed: true }
    if (!allowed) {
      alert('No credits remaining! Please top up to continue.')
      return
    }
    const { error } = await supabase.from('readings').insert({
      user_id: session.user.id,
      temperature: parsed.temperature,
      unit: parsed.unit,
      date: parsed.date,
      time: parsed.time,
      date_display: parsed.date_display,
      time_display: parsed.time_display,
    })
    if (error) { alert('Save failed: ' + error.message); return }
    setSaved(true)
    setParsed(null)
    setTranscript('')
    transcriptRef.current = ''
    setManualText('')
  }

  return (
    <div style={{ padding: '16px 0 40px' }}>

      {/* Unit toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', background: '#f0eeea', borderRadius: '10px', padding: '3px', gap: '3px' }}>
          {['F', 'C'].map(u => (
            <button key={u} onClick={() => saveUnit(u)}
              style={{ padding: '6px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500', background: unit === u ? '#ff6b35' : 'none', color: unit === u ? '#fff' : '#999' }}>
              °{u}
            </button>
          ))}
        </div>
      </div>

      {/* Credits warning */}
      {creditsData && !creditsData.loading && creditsData.freeRemaining > 0 && creditsData.freeRemaining <= 3 && (
        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.72rem', color: '#8a6000', textAlign: 'center' }}>
          ⚠️ {creditsData.freeRemaining} free readings left
        </div>
      )}
      {creditsData && !creditsData.loading && creditsData.totalRemaining === 0 && (
        <div style={{ background: '#ffe5e8', border: '1px solid #ffcdd2', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.72rem', color: '#c0003c', textAlign: 'center' }}>
          ❌ No credits left — top up to continue
        </div>
      )}

      {/* Mic */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: '8px 0 24px' }}>
        <button onClick={isRec ? () => {} : startRec}
          style={{ width: '90px', height: '90px', borderRadius: '50%', border: isRec ? '2px solid #ef233c' : '2px solid #ff6b35', background: isRec ? '#ffe5e8' : '#fff5f1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(255,107,53,0.15)' }}>
          <span style={{ fontSize: '2rem' }}>{isRec ? '⏹' : '🎤'}</span>
        </button>
        <span style={{ fontSize: '0.64rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>
          {isRec ? 'Listening… tap to stop' : 'Tap to speak'}
        </span>
      </div>

      {/* Transcript */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '14px', minHeight: '56px', fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '13px' }}>
        {transcript
          ? <span style={{ color: '#1a1a1a' }}>{transcript}</span>
          : <span style={{ color: '#bbb', fontStyle: 'italic', fontSize: '0.75rem' }}>e.g. "101 now" or "38.5 on March 13 at 2pm"</span>}
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#999', fontSize: '0.78rem', marginBottom: '13px' }}>Parsing…</div>}

      {/* Parsed result */}
      {parsed && !loading && (
        <div style={{ background: '#e3fcef', border: '1px solid #abf5d1', borderRadius: '14px', padding: '16px', marginBottom: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.1em' }}>Temperature</span>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#1a1a1a' }}>{parsed.temperature}°{parsed.unit}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.1em' }}>Date</span>
            <span style={{ fontSize: '0.82rem', color: '#00875a' }}>{parsed.date_display}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.1em' }}>Time</span>
            <span style={{ fontSize: '0.82rem', color: '#00875a' }}>{parsed.time_display}</span>
          </div>
          <button onClick={saveReading} style={{ width: '100%', background: '#00875a', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', marginTop: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ✅ Save Reading
          </button>
        </div>
      )}

      {saved && (
        <div style={{ textAlign: 'center', color: '#00875a', fontSize: '0.82rem', marginBottom: '16px', padding: '12px', background: '#e3fcef', borderRadius: '10px', border: '1px solid #abf5d1' }}>
          ✓ Reading saved!
        </div>
      )}

      {/* Manual entry */}
      <button onClick={() => setManualMode(!manualMode)} style={{ width: '100%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '11px', color: '#999', fontSize: '0.69rem', cursor: 'pointer', marginBottom: '10px' }}>
        ✏️ Type manually instead
      </button>

      {manualMode && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            style={{ flex: 1, background: '#fff', border: '1px solid #e0e0e0', borderRadius: '9px', padding: '11px 13px', color: '#1a1a1a', fontSize: '0.79rem', outline: 'none', fontFamily: 'monospace' }}
            placeholder={unit === 'F' ? '"101 on March 14 at 9am"' : '"38.5 on March 14 at 9am"'}
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doParse(manualText)}
          />
          <button onClick={() => doParse(manualText)} style={{ background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '9px', padding: '11px 16px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '500' }}>
            Parse
          </button>
        </div>
      )}
    </div>
  )
}