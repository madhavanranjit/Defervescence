import { useState } from 'react'
import { supabase } from '../supabase'
import { useCredits } from '../useCredits'
import { PatientProvider, usePatient } from '../PatientContext'
import PatientSelector from './PatientSelector'
import LogTab from './LogTab'
import DoctorTab from './DoctorTab'
import MedicineTab from './MedicineTab'
import SetupTab from './SetupTab'

function DashboardInner({ session, onSignOut }) {
  const [tab, setTab] = useState('log')
  const creditsData = useCredits(session)
  const { activePatient } = usePatient()

  async function handleSignOut() {
    try {
      if (session) await supabase.auth.signOut()
    } catch(e) {
      console.log('signout error', e)
    }
    onSignOut()
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.title}>Defer<span style={s.accent}>vescence</span></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!creditsData.loading && (
            <span style={{ fontSize: '0.65rem', color: creditsData.totalRemaining > 0 ? '#00875a' : '#c0003c', background: creditsData.totalRemaining > 0 ? '#e3fcef' : '#ffe5e8', padding: '4px 10px', borderRadius: '20px', fontWeight: '500' }}>
              {creditsData.totalRemaining > 0 ? `${creditsData.totalRemaining} left` : 'No credits'}
            </span>
          )}
          <button onClick={handleSignOut} style={s.signOut}>Sign out</button>
        </div>
      </header>

      <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <PatientSelector />
        {activePatient && (
          <span style={{ fontSize: '0.65rem', color: '#999' }}>{activePatient.relation}</span>
        )}
      </div>

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
        {activePatient ? <>
          {tab === 'log' && <LogTab session={session} creditsData={creditsData} patient={activePatient} />}
          {tab === 'doctor' && <DoctorTab session={session} patient={activePatient} />}
          {tab === 'medicines' && <MedicineTab session={session} creditsData={creditsData} patient={activePatient} />}
          {tab === 'setup' && <SetupTab session={session} creditsData={creditsData} onSignOut={handleSignOut} />}
        </> : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '0.8rem' }}>
            Add a patient to get started
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard({ session, onSignOut }) {
  return (
    <PatientProvider session={session}>
      <DashboardInner session={session} onSignOut={onSignOut} />
    </PatientProvider>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#f7f6f3', color: '#1a1a1a', fontFamily: 'monospace' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px', background: '#fff', borderBottom: '1px solid #e0e0e0' },
  title: { fontFamily: 'Georgia,serif', fontSize: '1.3rem', color: '#1a1a1a' },
  accent: { color: '#ff6b35', fontStyle: 'italic' },
  signOut: { background: 'none', border: '1px solid #e0e0e0', borderRadius: '8px', color: '#999', fontSize: '0.7rem', padding: '6px 12px', cursor: 'pointer' },
  tabs: { display: 'flex', gap: '4px', background: '#fff', padding: '8px 16px', borderBottom: '1px solid #e0e0e0' },
  tab: { flex: 1, padding: '9px 4px', border: 'none', borderRadius: '10px', background: 'none', color: '#999', fontSize: '0.62rem', cursor: 'pointer', letterSpacing: '0.06em' },
  tabActive: { background: '#fff5f1', color: '#ff6b35', fontWeight: '500' },
  content: { padding: '0 16px' },
}