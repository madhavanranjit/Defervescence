import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

export default function DoctorTab({ session }) {
  const [readings, setReadings] = useState([])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [r, m] = await Promise.all([
      supabase.from('readings').select('*').eq('user_id', session.user.id).order('date').order('time'),
      supabase.from('medicines').select('*').eq('user_id', session.user.id).order('date').order('time')
    ])
    if (r.data) setReadings(r.data)
    if (m.data) setMedicines(m.data)
    setLoading(false)
  }

  async function deleteReading(id) {
    if (!confirm('Delete this reading?')) return
    await supabase.from('readings').delete().eq('id', id)
    fetchAll()
  }

  async function deleteMedicine(id) {
    if (!confirm('Delete this medicine?')) return
    await supabase.from('medicines').delete().eq('id', id)
    fetchAll()
  }

  function toF(t, u) { return u === 'C' ? +(t * 9 / 5 + 32).toFixed(1) : t }
  function tempColor(t, u) {
    const f = toF(t, u)
    return f >= 103 ? '#ef233c' : f >= 100.4 ? '#ffd166' : '#06d6a0'
  }
  function statusLabel(t, u) {
    const f = toF(t, u)
    return f >= 103 ? 'High' : f >= 100.4 ? 'Mild fever' : 'Normal'
  }

  const chartData = readings.map(r => ({
    label: `${r.date_display?.replace(', 2026', '') || r.date}\n${r.time_display || r.time}`,
    temp: toF(r.temperature, r.unit),
    unit: r.unit,
    original: r.temperature,
  }))

  const temps = readings.map(r => toF(r.temperature, r.unit))
  const peak = temps.length ? Math.max(...temps) : 0
  const avg = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 0

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#6b6875' }}>Loading…</div>

  if (!readings.length) return (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6b6875', fontSize: '0.8rem', lineHeight: '2' }}>
      No readings yet<br />
      <span style={{ fontSize: '0.7rem' }}>Log your first reading in the Log tab</span>
    </div>
  )

  return (
    <div style={{ padding: '8px 16px 60px' }}>

      {/* Print button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={() => window.print()} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 14px', color: '#6b6875', fontSize: '0.72rem', cursor: 'pointer' }}>
          🖨 Print / Share
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Peak', value: peak + '°', color: peak >= 103 ? '#ef233c' : peak >= 100.4 ? '#ffd166' : '#06d6a0' },
          { label: 'Average', value: avg + '°', color: '#f0ede8' },
          { label: 'Readings', value: readings.length, color: '#f0ede8' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1e1e24', borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.59rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6875', marginTop: '3px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '16px 8px', marginBottom: '16px' }}>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6875', marginBottom: '12px', paddingLeft: '8px' }}>Temperature over time (°F)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" tick={{ fill: '#6b6875', fontSize: 9 }} />
            <YAxis domain={['auto', 'auto']} tick={{ fill: '#6b6875', fontSize: 9 }} tickFormatter={v => v + '°'} />
            <Tooltip
              contentStyle={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.75rem' }}
              labelStyle={{ color: '#6b6875' }}
              formatter={(v) => [v + '°F', 'Temp']}
            />
            <ReferenceLine y={100.4} stroke="rgba(255,107,53,0.5)" strokeDasharray="4 4" label={{ value: '100.4°F', fill: 'rgba(255,107,53,0.7)', fontSize: 9, position: 'right' }} />
            <Line type="monotone" dataKey="temp" stroke="#ff6b35" strokeWidth={2.5} dot={({ cx, cy, payload }) => (
              <circle key={cx} cx={cx} cy={cy} r={5} fill={tempColor(payload.original, payload.unit)} stroke="none" />
            )} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: '14px', padding: '8px 8px 0', flexWrap: 'wrap' }}>
          {[['#ef233c', 'High (>102°F)'], ['#ffd166', 'Mild fever'], ['#06d6a0', 'Normal']].map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.61rem', color: '#6b6875' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c, flexShrink: 0 }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* Readings table */}
      <div style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '16px', marginBottom: '16px' }}>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6875', marginBottom: '12px' }}>All readings</p>
        {[...readings].reverse().map(r => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#f0ede8' }}>{r.date_display}</div>
              <div style={{ fontSize: '0.65rem', color: '#6b6875' }}>{r.time_display}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: tempColor(r.temperature, r.unit) + '22', color: tempColor(r.temperature, r.unit), borderRadius: '6px', padding: '3px 9px', fontSize: '0.78rem', fontWeight: '500' }}>
                {r.temperature}°{r.unit}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#6b6875' }}>{statusLabel(r.temperature, r.unit)}</span>
              <button onClick={() => deleteReading(r.id)} style={{ background: 'none', border: 'none', color: '#6b6875', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 6px' }}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Medicines table */}
      {medicines.length > 0 && (
        <div style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6875', marginBottom: '12px' }}>Medicines given</p>
          {[...medicines].reverse().map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#ff6b35', fontWeight: '500' }}>{m.name}</div>
                <div style={{ fontSize: '0.65rem', color: '#6b6875' }}>{m.dose}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#f0ede8' }}>{m.date_display}</div>
                  <div style={{ fontSize: '0.65rem', color: '#6b6875' }}>{m.time_display}</div>
                </div>
                <button onClick={() => deleteMedicine(m.id)} style={{ background: 'none', border: 'none', color: '#6b6875', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 6px' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '16px' }}>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6875', marginBottom: '10px' }}>Notes for doctor</p>
        <textarea placeholder="Symptoms, other observations…"
          style={{ width: '100%', background: '#1e1e24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '11px', color: '#f0ede8', fontSize: '0.75rem', resize: 'vertical', minHeight: '80px', outline: 'none', fontFamily: 'monospace', lineHeight: '1.6' }} />
      </div>

    </div>
  )
}