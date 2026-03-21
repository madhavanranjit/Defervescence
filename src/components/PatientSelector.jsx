import { useState } from 'react'
import { usePatient } from '../PatientContext'

const RELATIONS = ['Self', 'Child', 'Parent', 'Spouse', 'Grandparent', 'Sibling', 'Other']

export default function PatientSelector() {
  const { patients, activePatient, addPatient, deletePatient, switchPatient } = usePatient()
  const [showAdd, setShowAdd] = useState(false)
  const [showList, setShowList] = useState(false)
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('Self')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    await addPatient(name.trim(), relation)
    setName('')
    setRelation('Self')
    setShowAdd(false)
    setSaving(false)
  }

  if (!activePatient && !showAdd) {
    return (
      <div style={s.overlay}>
        <div style={s.card}>
          <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '8px' }}>🌡️</div>
          <h2 style={s.title}>Who are we tracking?</h2>
          <p style={s.hint}>Add a patient to get started</p>
          <input style={s.input} placeholder="Patient name e.g. Rahul"
            value={name} onChange={e => setName(e.target.value)} />
          <select style={s.select} value={relation} onChange={e => setRelation(e.target.value)}>
            {RELATIONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <button onClick={handleAdd} style={s.addBtn} disabled={saving || !name.trim()}>
            {saving ? 'Adding…' : 'Get Started'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShowList(!showList)} style={s.pill}>
        👤 {activePatient?.name || 'Select patient'}
        <span style={{ marginLeft: '4px', fontSize: '0.6rem' }}>▾</span>
      </button>

      {showList && (
        <div style={s.dropdown}>
          {patients.map(p => (
            <div key={p.id} style={{ ...s.dropItem, background: p.id === activePatient?.id ? '#fff5f1' : '#fff' }}>
              <button onClick={() => { switchPatient(p); setShowList(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', flex: 1, textAlign: 'left', padding: '0' }}>
                <span style={{ fontSize: '0.82rem', color: p.id === activePatient?.id ? '#ff6b35' : '#1a1a1a', fontWeight: p.id === activePatient?.id ? '500' : '400' }}>
                  {p.name}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#999', marginLeft: '6px' }}>{p.relation}</span>
              </button>
              {patients.length > 1 && (
                <button onClick={() => { if (confirm('Delete ' + p.name + '?')) deletePatient(p.id) }}
                  style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: '0.75rem' }}>🗑</button>
              )}
            </div>
          ))}

          {patients.length < 5 && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid #f0eeea' }}>
              {!showAdd ? (
                <button onClick={() => setShowAdd(true)}
                  style={{ background: 'none', border: 'none', color: '#ff6b35', fontSize: '0.75rem', cursor: 'pointer', padding: '0' }}>
                  + Add patient
                </button>
              ) : (
                <div>
                  <input style={{ ...s.input, marginBottom: '6px', fontSize: '0.75rem', padding: '8px' }}
                    placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                  <select style={{ ...s.select, marginBottom: '6px', fontSize: '0.75rem', padding: '8px' }}
                    value={relation} onChange={e => setRelation(e.target.value)}>
                    {RELATIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={handleAdd} style={{ ...s.addBtn, padding: '8px', fontSize: '0.72rem', flex: 1 }}>
                      Add
                    </button>
                    <button onClick={() => setShowAdd(false)}
                      style={{ background: '#f7f6f3', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '8px', fontSize: '0.72rem', cursor: 'pointer', flex: 1 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {patients.length >= 5 && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid #f0eeea', fontSize: '0.65rem', color: '#999', textAlign: 'center' }}>
              Max 5 patients reached
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: '#f7f6f3', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  card: { background: '#fff', borderRadius: '24px', padding: '32px 24px', width: '100%', maxWidth: '360px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#1a1a1a', textAlign: 'center', marginBottom: '6px' },
  hint: { fontSize: '0.75rem', color: '#999', textAlign: 'center', marginBottom: '20px' },
  input: { width: '100%', background: '#f7f6f3', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '12px', color: '#1a1a1a', fontSize: '0.85rem', outline: 'none', marginBottom: '10px', fontFamily: 'monospace', boxSizing: 'border-box' },
  select: { width: '100%', background: '#f7f6f3', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '12px', color: '#1a1a1a', fontSize: '0.85rem', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' },
  addBtn: { width: '100%', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' },
  pill: { background: '#fff5f1', border: '1px solid #ffd5c2', borderRadius: '20px', padding: '6px 12px', fontSize: '0.72rem', color: '#ff6b35', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
  dropdown: { position: 'absolute', top: '36px', left: 0, background: '#fff', border: '1px solid #e0e0e0', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '200px', overflow: 'hidden' },
  dropItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #f0eeea', cursor: 'pointer' },
}