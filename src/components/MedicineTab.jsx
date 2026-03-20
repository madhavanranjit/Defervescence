import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabase'

const MEDICINES = ['Calpol', 'Dolo', 'Ibuprofen', 'Combiflam', 'Paracetamol', 'Other']

export default function MedicineTab({ session, creditsData }) {
  const [medicines, setMedicines] = useState([])
  const [isRec, setIsRec] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsed, setParsed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualText, setManualText] = useState('')
  const transcriptRef = useRef('')

  useEffect(() => { fetchMedicines() }, [])

  async function fetchMedicines() {
    const { data } = await supabase
      .from('medicines')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .limit(20)
    if (data) setMedicines(data)
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
    try {
      const res = await fetch('https://defervescence.vercel.app/api/parse-medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      setParsed(result)
    } catch (e) {
      alert('Could not parse. Try again.')
    }
    setLoading(false)
  }

  async function saveMedicine() {
    if (!parsed) return
    const { error } = await supabase.from('medicines').insert({
      user_id: session.user.id,
      name: parsed.name,
      dose: parsed.dose,
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
    fetchMedicines()
  }

  return (
    <div style={{ padding: '16px 0 40px' }}>

      {/* Quick add */}
      <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '10px' }}>Quick add</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        {MEDICINES.map(m => (
          <button key={m} onClick={() => { setManualText(m + ' now'); setManualMode(true) }}
            style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '20px', padding: '7px 14px', color: '#1a1a1a', fontSize: '0.72rem', cursor: 'pointer' }}>
            {m}
          </button>
        ))}
      </div>

      {/* Mic */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: '8px 0 24px' }}>
        <button onClick={isRec ? () => {} : startRec}
          style={{ width: '90px', height: '90px', borderRadius: '50%', border: isRec ? '2px solid #ef233c' : '2px solid #ff6b35', background: isRec ? '#ffe5e8' : '#fff5f1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(255,107,53,0.15)' }}>
          <span style={{ fontSize: '2rem' }}>{isRec ? '⏹' : '🎤'}</span>
        </button>
        <span style={{ fontSize: '0.64rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>
          {isRec ? 'Listening…' : 'Say medicine name & dose'}
        </span>
      </div>

      {/* Transcript */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '14px', minHeight: '56px', fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '13px' }}>
        {transcript
          ? <span style={{ color: '#1a1a1a' }}>{transcript}</span>
          : <span style={{ color: '#bbb', fontStyle: 'italic', fontSize: '0.75rem' }}>e.g. "Calpol 250mg now" or "Dolo at 3pm"</span>}
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#999', fontSize: '0.78rem', marginBottom: '13px' }}>Parsing…</div>}

      {/* Parsed result */}
      {parsed && !loading && (
        <div style={{ background: '#fff5f1', border: '1px solid #ffd5c2', borderRadius: '14px', padding: '16px', marginBottom: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.1em' }}>Medicine</span>
            <span style={{ fontSize: '1rem', color: '#ff6b35', fontWeight: '600' }}>{parsed.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.1em' }}>Dose</span>
            <span style={{ fontSize: '0.82rem', color: '#1a1a1a' }}>{parsed.dose || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.1em' }}>Date</span>
            <span style={{ fontSize: '0.82rem', color: '#1a1a1a' }}>{parsed.date_display}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.1em' }}>Time</span>
            <span style={{ fontSize: '0.82rem', color: '#1a1a1a' }}>{parsed.time_display}</span>
          </div>
          <button onClick={saveMedicine} style={{ width: '100%', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', marginTop: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            💊 Save Medicine
          </button>
        </div>
      )}

      {saved && (
        <div style={{ textAlign: 'center', color: '#00875a', fontSize: '0.82rem', marginBottom: '16px', padding: '12px', background: '#e3fcef', borderRadius: '10px', border: '1px solid #abf5d1' }}>
          ✓ Medicine saved!
        </div>
      )}

      {/* Manual entry */}
      <button onClick={() => setManualMode(!manualMode)} style={{ width: '100%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '11px', color: '#999', fontSize: '0.69rem', cursor: 'pointer', marginBottom: '10px' }}>
        ✏️ Type manually instead
      </button>

      {manualMode && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input style={{ flex: 1, background: '#fff', border: '1px solid #e0e0e0', borderRadius: '9px', padding: '11px 13px', color: '#1a1a1a', fontSize: '0.79rem', outline: 'none', fontFamily: 'monospace' }}
            placeholder='"Calpol 250mg at 3pm"'
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doParse(manualText)}
          />
          <button onClick={() => doParse(manualText)} style={{ background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '9px', padding: '11px 16px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '500' }}>
            Parse
          </button>
        </div>
      )}

      {/* Recent medicines */}
      {medicines.length > 0 && (
        <>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '10px' }}>Recent</p>
          {medicines.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#ff6b35', fontWeight: '500' }}>{m.name}</span>
                {m.dose && <span style={{ fontSize: '0.72rem', color: '#999', marginLeft: '8px' }}>{m.dose}</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#1a1a1a' }}>{m.date_display}</div>
                <div style={{ fontSize: '0.65rem', color: '#999' }}>{m.time_display}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}