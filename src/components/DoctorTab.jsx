import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import ShareReport from './ShareReport'
import html2canvas from 'html2canvas'

export default function DoctorTab({ session, patient }) {
  const [readings, setReadings] = useState([])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState(localStorage.getItem('preferredUnit') || 'F')
  const [showReport, setShowReport] = useState(false)
  const [filter, setFilter] = useState('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const chartRef = useRef(null)

  useEffect(() => { fetchAll() }, [patient?.id])

  async function fetchAll() {
  if (!patient?.id || !session) {
    setLoading(false)
    return
  }
    const [r, m] = await Promise.all([
      supabase.from('readings').select('*')
        .eq('user_id', session.user.id)
        .eq('patient_id', patient.id)
        .order('date').order('time'),
      supabase.from('medicines').select('*')
        .eq('user_id', session.user.id)
        .eq('patient_id', patient.id)
        .order('date').order('time')
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

  async function exportChartAsImage() {
    if (!chartRef.current) return
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    })
    const image = canvas.toDataURL('image/png')
    if (navigator.share) {
      const blob = await (await fetch(image)).blob()
      const file = new File([blob], 'fever-chart.png', { type: 'image/png' })
      await navigator.share({
        title: `Fever Report — ${patient?.name}`,
        text: `Fever chart for ${patient?.name} — Shared via Defervescence`,
        files: [file]
      })
    } else {
      const link = document.createElement('a')
      link.download = `fever-chart-${patient?.name || 'report'}.png`
      link.href = image
      link.click()
    }
  }

  function saveUnit(u) {
    setUnit(u)
    localStorage.setItem('preferredUnit', u)
  }

  function convert(t, fromUnit) {
    if (unit === fromUnit) return +t
    if (unit === 'C') return +(((t - 32) * 5) / 9).toFixed(1)
    return +(t * 9 / 5 + 32).toFixed(1)
  }

  function tempColor(t, u) {
    const f = u === 'C' ? +(t * 9 / 5 + 32).toFixed(1) : +t
    return f >= 103 ? '#c0003c' : f >= 100.4 ? '#8a6000' : '#00875a'
  }

  function tempBg(t, u) {
    const f = u === 'C' ? +(t * 9 / 5 + 32).toFixed(1) : +t
    return f >= 103 ? '#ffe5e8' : f >= 100.4 ? '#fff8e1' : '#e3fcef'
  }

  function statusLabel(t, u) {
    const f = u === 'C' ? +(t * 9 / 5 + 32).toFixed(1) : +t
    return f >= 103 ? 'High' : f >= 100.4 ? 'Mild fever' : 'Normal'
  }

  function filterReadings(data) {
    if (filter === 'all') return data
    if (filter === 'custom' && customFrom && customTo) {
      return data.filter(r => r.date >= customFrom && r.date <= customTo)
    }
    const days = filter === '3d' ? 3 : filter === '7d' ? 7 : 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return data.filter(r => new Date(r.date) >= cutoff)
  }

  const filteredReadings = filterReadings(readings)
  const filteredMedicines = filterReadings(medicines)

  const chartData = filteredReadings.map(r => ({
    label: r.date ? `${new Date(r.date + 'T12:00:00').getDate()}/${new Date(r.date + 'T12:00:00').getMonth() + 1}` : r.date,
    fullDate: r.date,
    temp: convert(r.temperature, r.unit),
    unit: r.unit,
    original: r.temperature,
  }))

  const temps = filteredReadings.map(r => convert(r.temperature, r.unit))
  const peak = temps.length ? Math.max(...temps) : 0
  const last = filteredReadings.length ? filteredReadings[filteredReadings.length - 1] : null

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Loading…</div>
  )

  if (!readings.length) return (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#999', fontSize: '0.8rem', lineHeight: '2' }}>
      No readings yet<br />
      <span style={{ fontSize: '0.7rem' }}>Log your first reading in the Log tab</span>
    </div>
  )

  return (
    <div style={{ padding: '16px 0 60px' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', background: '#f0eeea', borderRadius: '10px', padding: '3px', gap: '3px' }}>
          {['F', 'C'].map(u => (
            <button key={u} onClick={() => saveUnit(u)}
              style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500', background: unit === u ? '#ff6b35' : 'none', color: unit === u ? '#fff' : '#999' }}>
              °{u}
            </button>
          ))}
        </div>
        <button onClick={() => setShowReport(true)}
          style={{ background: '#ff6b35', border: 'none', borderRadius: '8px', padding: '8px 14px', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: '500' }}>
          📤 Share Report
        </button>
      </div>

      {/* Date filter */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {[['3d', '3 days'], ['7d', '7 days'], ['30d', '30 days'], ['all', 'All'], ['custom', 'Custom']].map(([val, label]) => (
            <button key={val} onClick={() => { setFilter(val); setShowCustom(val === 'custom') }}
              style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid', borderColor: filter === val ? '#ff6b35' : '#e0e0e0', background: filter === val ? '#fff5f1' : '#fff', color: filter === val ? '#ff6b35' : '#999', fontSize: '0.68rem', cursor: 'pointer', fontWeight: filter === val ? '500' : '400' }}>
              {label}
            </button>
          ))}
        </div>
        {showCustom && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '10px 12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>From</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                style={{ width: '100%', background: '#f7f6f3', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '8px', color: '#1a1a1a', fontSize: '0.78rem', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>To</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                style={{ width: '100%', background: '#f7f6f3', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '8px', color: '#1a1a1a', fontSize: '0.78rem', outline: 'none' }} />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Peak', value: peak + '°', color: peak >= (unit === 'F' ? 103 : 39.4) ? '#c0003c' : peak >= (unit === 'F' ? 100.4 : 38) ? '#8a6000' : '#00875a', bg: peak >= (unit === 'F' ? 103 : 39.4) ? '#ffe5e8' : peak >= (unit === 'F' ? 100.4 : 38) ? '#fff8e1' : '#e3fcef' },
          { label: 'Readings', value: filteredReadings.length, color: '#1a1a1a', bg: '#f7f6f3' },
          { label: 'Last', value: last ? convert(last.temperature, last.unit) + '°' : '—', color: '#1a1a1a', bg: '#f7f6f3' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '12px 8px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.59rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', marginTop: '3px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div ref={chartRef} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '18px', padding: '16px 8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingLeft: '8px', paddingRight: '8px' }}>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', margin: 0 }}>
            Temperature over time (°{unit})
          </p>
          <button onClick={exportChartAsImage}
            style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '5px 10px', fontSize: '0.65rem', color: '#999', cursor: 'pointer' }}>
            📸 Share chart
          </button>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0eeea" />
            <XAxis dataKey="label" tick={{ fill: '#999', fontSize: 9 }} />
            <YAxis domain={['auto', 'auto']} tick={{ fill: '#999', fontSize: 9 }} tickFormatter={v => v + '°'} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.75rem' }}
              labelStyle={{ color: '#999' }}
              formatter={v => [v + '°' + unit, 'Temp']}
            />
            <ReferenceLine
              y={unit === 'F' ? 100.4 : 38}
              stroke="rgba(255,107,53,0.5)"
              strokeDasharray="4 4"
              label={{ value: unit === 'F' ? '100.4°F' : '38°C', fill: '#ff6b35', fontSize: 9, position: 'right' }}
            />
            <Line type="monotone" dataKey="temp" stroke="#ff6b35" strokeWidth={2.5}
              dot={({ cx, cy, payload }) => {
                const hasMed = filteredMedicines.some(m => {
                  const mLabel = m.date ? `${new Date(m.date + 'T12:00:00').getDate()}/${new Date(m.date + 'T12:00:00').getMonth() + 1}` : null
                  return mLabel === payload.label
                })
                return (
                  <g key={cx}>
                    <circle cx={cx} cy={cy} r={5} fill={tempColor(payload.original, payload.unit)} stroke="#fff" strokeWidth={1.5} />
                    {hasMed && (
                      <>
                        <circle cx={cx} cy={cy - 16} r={8} fill="#fff5f1" stroke="#ff6b35" strokeWidth={1} />
                        <text x={cx} y={cy - 12} textAnchor="middle" fontSize={10}>💊</text>
                      </>
                    )}
                  </g>
                )
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: '14px', padding: '8px 8px 0', flexWrap: 'wrap' }}>
          {[['#c0003c', 'High'], ['#8a6000', 'Mild fever'], ['#00875a', 'Normal'], ['#ff6b35', '💊 Medicine']].map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.61rem', color: '#999' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c, flexShrink: 0 }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* Readings table */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '18px', padding: '16px', marginBottom: '16px' }}>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '12px' }}>All readings</p>
        {[...filteredReadings].reverse().map(r => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0eeea' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#1a1a1a' }}>{r.date_display}</div>
              <div style={{ fontSize: '0.65rem', color: '#999' }}>{r.time_display}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: tempBg(r.temperature, r.unit), color: tempColor(r.temperature, r.unit), borderRadius: '6px', padding: '3px 9px', fontSize: '0.78rem', fontWeight: '500' }}>
                {convert(r.temperature, r.unit)}°{unit}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#999', minWidth: '55px' }}>{statusLabel(r.temperature, r.unit)}</span>
              <button onClick={() => deleteReading(r.id)}
                style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 6px' }}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Medicines table */}
      {filteredMedicines.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '18px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '12px' }}>Medicines given</p>
          {[...filteredMedicines].reverse().map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0eeea' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#ff6b35', fontWeight: '500' }}>{m.name}</div>
                <div style={{ fontSize: '0.65rem', color: '#999' }}>{m.dose}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#1a1a1a' }}>{m.date_display}</div>
                  <div style={{ fontSize: '0.65rem', color: '#999' }}>{m.time_display}</div>
                </div>
                <button onClick={() => deleteMedicine(m.id)}
                  style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 6px' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '18px', padding: '16px' }}>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '10px' }}>Notes for doctor</p>
        <textarea placeholder="Symptoms, other observations…"
          style={{ width: '100%', background: '#f7f6f3', border: '1px solid #e0e0e0', borderRadius: '9px', padding: '11px', color: '#1a1a1a', fontSize: '0.75rem', resize: 'vertical', minHeight: '80px', outline: 'none', fontFamily: 'monospace', lineHeight: '1.6' }} />
      </div>

      {/* Share report modal */}
      {showReport && (
        <ShareReport
          readings={filteredReadings}
          medicines={filteredMedicines}
          patientName={patient?.name}
          onClose={() => setShowReport(false)}
        />
      )}

    </div>
  )
}