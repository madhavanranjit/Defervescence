import { useState, useRef } from 'react'
import { supabase } from '../supabase'

const OPENAI_API = 'https://api.openai.com/v1/chat/completions'

export default function LogTab({ session }) {
  const [isRec, setIsRec] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsed, setParsed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualText, setManualText] = useState('')
  const apiKey = localStorage.getItem('openaiKey') || 'PASTE_YOUR_KEY_HERE'
  const transcriptRef = useRef('')

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
    const prompt = `Today is ${now.toDateString()}, time is ${now.toLocaleTimeString()}. User said: "${text}". Extract temperature and date/time. Return ONLY valid JSON, no markdown: {"temperature":<number>,"unit":"F" or "C","date":"YYYY-MM-DD","time":"HH:MM","time_display":"e.g. 2:30 PM","date_display":"e.g. March 13, 2025"}. If no date/time, use today/now. If no unit, assume Fahrenheit.`
    try {
      const res = await fetch(OPENAI_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 200, temperature: 0, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      const raw = data.choices?.[0]?.message?.content || ''
      const result = JSON.parse(raw.replace(/```json|```/g, '').trim())
      setParsed(result)
    } catch (e) {
      alert('Could not parse. Try again.')
    }
    setLoading(false)
  }

  async function saveReading() {
    if (!parsed) return
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
    <div style={{ padding: '8px 16px 40px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: '8px 0 20px' }}>
        <button onClick={isRec ? () => {} : startRec} style={{ width: '90px', height: '90px', borderRadius: '50%', border: isRec ? '2px solid #ef233c' : '2px solid #ff6b35', background: isRec ? 'rgba(239,35,60,0.1)' : 'rgba(255,107,53,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ fontSize: '2rem' }}>{isRec ? '⏹' : '🎤'}</span>
        </button>
        <span style={{ fontSize: '0.64rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6875' }}>
          {isRec ? 'Listening… tap to stop' : 'Tap to speak'}
        </span>
      </div>

      <div style={{ background: '#1e1e24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', minHeight: '56px', fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '13px' }}>
        {transcript
          ? <span style={{ color: '#f0ede8' }}>{transcript}</span>
          : <span style={{ color: '#6b6875', fontStyle: 'italic', fontSize: '0.75rem' }}>e.g. "101 now" or "100.4 on March 13 at 2pm"</span>}
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#6b6875', fontSize: '0.78rem', marginBottom: '13px' }}>Parsing…</div>}

      {parsed && !loading && (
        <div style={{ background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.25)', borderRadius: '14px', padding: '16px', marginBottom: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#6b6875', letterSpacing: '0.1em' }}>Temperature</span>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#ffd166' }}>{parsed.temperature}°{parsed.unit}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#6b6875', letterSpacing: '0.1em' }}>Date</span>
            <span style={{ fontSize: '0.82rem', color: '#06d6a0' }}>{parsed.date_display}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#6b6875', letterSpacing: '0.1em' }}>Time</span>
            <span style={{ fontSize: '0.82rem', color: '#06d6a0' }}>{parsed.time_display}</span>
          </div>
          <button onClick={saveReading} style={{ width: '100%', background: '#06d6a0', color: '#0d0d0f', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', marginTop: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ✅ Save Reading
          </button>
        </div>
      )}

      {saved && (
        <div style={{ textAlign: 'center', color: '#06d6a0', fontSize: '0.82rem', marginBottom: '16px', padding: '12px', background: 'rgba(6,214,160,0.06)', borderRadius: '10px', border: '1px solid rgba(6,214,160,0.2)' }}>
          ✓ Reading saved to cloud!
        </div>
      )}

      <button onClick={() => setManualMode(!manualMode)} style={{ width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '11px', color: '#6b6875', fontSize: '0.69rem', cursor: 'pointer', marginBottom: '10px' }}>
        ✏️ Type manually instead
      </button>

      {manualMode && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            style={{ flex: 1, background: '#1e1e24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '11px 13px', color: '#f0ede8', fontSize: '0.79rem', outline: 'none', fontFamily: 'monospace' }}
            placeholder='"102.2 on March 14 at 9am"'
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