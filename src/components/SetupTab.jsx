import { useState } from 'react'
import { supabase } from '../supabase'

export default function SetupTab({ session }) {
  return (
    <div style={{ padding: '8px 16px 40px' }}>

      <div style={s.card}>
        <p style={s.label}>Logged in as</p>
        <p style={s.value}>{session.user.email || session.user.phone}</p>
        <button onClick={() => supabase.auth.signOut()} style={s.signOutBtn}>Sign out</button>
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
  cardTitle: { fontSize: '0.85rem', color: '#f0ede8', fontWeight: '500', marginBottom: '10px' },
  label: { fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6875', marginBottom: '4px' },
  value: { fontSize: '0.85rem', color: '#ff6b35', marginBottom: '14px' },
  signOutBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 16px', color: '#6b6875', fontSize: '0.72rem', cursor: 'pointer' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  infoLabel: { fontSize: '0.7rem', color: '#6b6875' },
  infoVal: { fontSize: '0.7rem', color: '#f0ede8' },
}