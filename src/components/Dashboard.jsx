import { useState } from 'react'
import { supabase } from '../supabase'
import { useCredits } from '../useCredits'
import LogTab from './LogTab'
import DoctorTab from './DoctorTab'
import MedicineTab from './MedicineTab'
import SetupTab from './SetupTab'

export default function Dashboard({ session }) {
  const [tab, setTab] = useState('log')
  const creditsData = useCredits(session)

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.title}>Defer<span style={s.accent}>vescence</span></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!creditsData.loading && (
            <span style={{ fontSize: '0.65rem', color: creditsData.totalRemaining > 0 ? '#00875a' : '#ef233c', background: creditsData.totalRemaining > 0 ? '#e3fcef' : '#ffe5e8', padding: '4px 10px', borderRadius: '20px', fontWeight: '500' }}>
              {creditsData.totalRemaining > 0 ? `${creditsData.totalRemaining} left` : 'No credits'}
            </span>
          )}
          <button onClick={signOut} style={s.signOut}>Sign out</button>
        </div>
      </header>

      <div style={s.tabs}>
        {['log', 'doctor', 'medicines', 'setup'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
            {t === 'log' ? '🎤' : t === 'doctor' ? '📊' : t === 'medicines' ? '💊' : '⚙️'}
            {' '}{t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={s.content}>
        {tab === 'log' && <LogTab session={session} creditsData={creditsData} />}
        {tab === 'doctor' && <DoctorTab session={session} />}
        {tab === 'medicines' && <MedicineTab session={session} creditsData={creditsData} />}
        {tab === 'setup' && <SetupTab session={session} creditsData={creditsData} />}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#f7f6f3', color: '#1a1a1a', fontFamily: 'monospace' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 12px', background: '#fff', borderBottom: '1px solid #e0e0e0' },
  title: { fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#1a1a1a' },
  accent: { color: '#ff6b35', fontStyle: 'italic' },
  signOut: { background: 'none', border: '1px solid #e0e0e0', borderRadius: '8px', color: '#999', fontSize: '0.7rem', padding: '6px 12px', cursor: 'pointer' },
  tabs: { display: 'flex', gap: '4px', background: '#fff', padding: '8px 16px', borderBottom: '1px solid #e0e0e0' },
  tab: { flex: 1, padding: '9px 4px', border: 'none', borderRadius: '10px', background: 'none', color: '#999', fontSize: '0.62rem', cursor: 'pointer', letterSpacing: '0.06em' },
  tabActive: { background: '#fff5f1', color: '#ff6b35', fontWeight: '500' },
  content: { padding: '0 16px' },
}