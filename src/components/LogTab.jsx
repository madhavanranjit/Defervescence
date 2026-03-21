import { useState, useRef } from 'react'
import { supabase } from '../supabase'

export default function LogTab({ session, creditsData, patient }) {
  const [isRec, setIsRec] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsed, setParsed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [unit, setUnit] = useState(localStorage.getItem('preferredUnit') || 'F')
  const transcriptRef = useRef('')

  const now = new Date()
  const [manualTemp, setManualTemp] = useState('')
  const [manualDate, setManualDate] = useState(now.toISOString().split('T')[0])
  const [manualTime, setManualTime] = useState(now.toTimeString().slice(0, 5))

  const apiBase = 'https://defervescence.vercel.app'

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
  console.log('Fetching:', `${apiBase}/api/parse`)
  const res = await fetch(`${apiBase}/api/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, localDate, localTime, preferredUnit: unit })
  })
  console.log('Status:', res.status)
  const responseText = await res.text()
  console.log('Response:', responseText)
  const result = JSON.parse(responseText)
  if (result.error) throw new Error(result.error)
  setParsed(result)
} catch (e) {
  alert('Error: ' + e.message)
}
    setLoading(false)
  }

  async function saveVoiceReading() {
    if (!parsed) return
    const { allowed } = creditsData ? await creditsData.useCredit() : { allowed: true }
    if (!allowed) {
      alert('No credits remaining! Please top up to continue.')
      return
    }

    const reading = {
      user_id: session?.user?.id,
      patient_id: patient?.id,
      temperature: parsed.temperature,
      unit: parsed.unit,
      date: parsed.date,
      time: parsed.time,
      date_display: parsed.date_display,
      time_display: parsed.time_display,
    }

    if (!session) {
      const { saveLocalReading } = await import('../localData')
      saveLocalReading(reading)
    } else {
      const { error } = await supabase.from('readings').insert(reading)
      if (error) { alert('Save failed: ' + error.message); return }
    }
    setSaved(true)
    setParsed(null)
    setTranscript('')
    transcriptRef.current = ''
  }

  async function saveManualReading() {
    if (!manualTemp) { alert('Please enter a temperature'); return }
    const temp = parseFloat(manualTemp)
    if (isNaN(temp)) { alert('Please enter a valid temperature'); return }
    const dateObj = new Date(manualDate + 'T' + manualTime)
    const date_display = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const time_display = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

    const reading = {
      user_id: session?.user?.id,
      patient_id: patient?.id,
      temperature: temp,
      unit,
      date: manualDate,
      time: manualTime,
      date_display,
      time_display,
    }

    if (!session) {
      const { saveLocalReading } = await import('../localData')
      saveLocalReading(reading)
    } else {
      const { error } = await supabase.from('readings').insert(reading)
      if (error) { alert('Save failed: ' + error.message); return }
    }
    setSaved(true)
    setManualTemp('')
  }

  return (
    <div style={{ padding: '16px 0 40px' }}>

      {/* Patient banner */}
      {patient && (
        <div style={{ background: '#fff5f1', border: '1px solid #ffd5c2', borderRadius: '10px', padding: '8px 14px', marginBottom: '16px', fontSize: '0.75rem', color: '#ff6b35', display: 'flex', alignItems: 'center', gap: '6px' }}>
          👤 Logging for <strong>{patient.name}</strong>
        </div>
      )}

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
      {creditsData && !creditsData.loading && creditsData.freeRemaining <= 3 && creditsData.freeRemaining > 0 && (
        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.72rem', color: '#8a6000', textAlign: 'center' }}>
          ⚠️ {creditsData.freeRemaining} voice credits left
        </div>
      )}
      {creditsData && !creditsData.loading && creditsData.totalRemaining === 0 && (
        <div style={{ background: '#ffe5e8', border: '1px solid #ffcdd2', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.72rem', color: '#c0003c', textAlign: 'center' }}>
          ❌ No voice credits — use manual entry (free) or top up
        </div>
      )}

      {/* Voice section */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '18px', padding: '20px 16px', marginBottom: '14px' }}>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '16px', textAlign: 'center' }}>
          🎤 Voice entry — uses 1 credit
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button onClick={isRec ? () => {} : startRec}
            style={{ width: '80px', height: '80px', borderRadius: '50%', border: isRec ? '2px solid #ef233c' : '2px solid #ff6b35', background: isRec ? '#ffe5e8' : '#fff5f1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(255,107,53,0.15)' }}>
            <span style={{ fontSize: '1.8rem' }}>{isRec ? '⏹' : '🎤'}</span>
          </button>
          <span style={{ fontSize: '0.64rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>
            {isRec ? 'Listening… tap to stop' : 'Tap to speak'}
          </span>
        </div>

        <div style={{ background: '#f7f6f3', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '12px', minHeight: '44px', fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '10px' }}>
          {transcript
            ? <span style={{ color: '#1a1a1a' }}>{transcript}</span>
            : <span style={{ color: '#bbb', fontStyle: 'italic', fontSize: '0.75rem' }}>e.g. "101 now" or "38.5 yesterday at 2pm"</span>}
        </div>

        {loading && <div style={{ textAlign: 'center', color: '#999', fontSize: '0.78rem' }}>Parsing…</div>}

        {parsed && !loading && (
          <div style={{ background: '#e3fcef', border: '1px solid #abf5d1', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.1em' }}>Temperature</span>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', color: '#1a1a1a' }}>{parsed.temperature}°{parsed.unit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.1em' }}>Date</span>
              <span style={{ fontSize: '0.8rem', color: '#00875a' }}>{parsed.date_display}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.1em' }}>Time</span>
              <span style={{ fontSize: '0.8rem', color: '#00875a' }}>{parsed.time_display}</span>
            </div>
            <button onClick={saveVoiceReading} style={{ width: '100%', background: '#00875a', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ✅ Save Reading
            </button>
          </div>
        )}
      </div>

      {/* Manual section */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '18px', padding: '20px 16px', marginBottom: '14px' }}>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '16px', textAlign: 'center' }}>
          ✏️ Manual entry — always free
        </p>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', display: 'block', marginBottom: '6px' }}>
            Temperature (°{unit})
          </label>
          <input type="number" step="0.1"
            placeholder={unit === 'F' ? 'e.g. 101.4' : 'e.g. 38.5'}
            value={manualTemp}
            onChange={e => setManualTemp(e.target.value)}
            style={{ width: '100%', background: '#f7f6f3', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '12px', color: '#1a1a1a', fontSize: '1rem', outline: 'none', fontFamily: 'monospace' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', display: 'block', marginBottom: '6px' }}>Date</label>
          <input type="date" value={manualDate}
            onChange={e => setManualDate(e.target.value)}
            style={{ width: '100%', background: '#f7f6f3', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '12px', color: '#1a1a1a', fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', display: 'block', marginBottom: '6px' }}>Time</label>
          <input type="time" value={manualTime}
            onChange={e => setManualTime(e.target.value)}
            style={{ width: '100%', background: '#f7f6f3', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '12px', color: '#1a1a1a', fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace' }}
          />
        </div>

        <button onClick={saveManualReading}
          style={{ width: '100%', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          💾 Save Reading — Free
        </button>
      </div>

      {saved && (
        <div style={{ textAlign: 'center', color: '#00875a', fontSize: '0.82rem', marginBottom: '16px', padding: '12px', background: '#e3fcef', borderRadius: '10px', border: '1px solid #abf5d1' }}>
          ✓ Reading saved{patient ? ` for ${patient.name}` : ''}!
        </div>
      )}

    </div>
  )
}