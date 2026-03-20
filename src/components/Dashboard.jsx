import { useState } from 'react'
import { supabase } from '../supabase'
import LogTab from './LogTab'
import MedicineTab from './MedicineTab'

export default function Dashboard({ session }) {
  const [tab, setTab] = useState('log')

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.title}>Defer<span style={s.accent}>vescence</span></h1>
        <button onClick={signOut} style={s.signOut}>Sign out</button>
      </header>

      <div style={s.tabs}>
        {['log','doctor','medicines','setup'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{...s.tab, ...(tab===t ? s.tabActive : {})}}>
            {t === 'log' ? '🎤' : t === 'doctor' ? '📊' : t === 'medicines' ? '💊' : '⚙️'}
            {' '}{t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={s.content}>
        {tab === 'log' && <LogTab session={session} />}
        {tab === 'medicines' && <MedicineTab session={session} />}
        {tab === 'medicines' && <p style={s.soon}>Medicine tracker — coming next!</p>}
        {tab === 'setup' && (
          <div>
            <p style={s.soon}>Logged in as:</p>
            <p style={{color:'#ff6b35',fontSize:'0.85rem',textAlign:'center'}}>{session.user.email || session.user.phone}</p>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page: {minHeight:'100vh',background:'#0d0d0f',color:'#f0ede8',fontFamily:'monospace'},
  header: {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'24px 20px 12px'},
  title: {fontFamily:'Georgia,serif',fontSize:'1.4rem',color:'#f0ede8'},
  accent: {color:'#ff6b35',fontStyle:'italic'},
  signOut: {background:'none',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#6b6875',fontSize:'0.7rem',padding:'6px 12px',cursor:'pointer'},
  tabs: {display:'flex',gap:'4px',padding:'0 16px',marginBottom:'16px',background:'#16161a',margin:'0 16px 16px',borderRadius:'14px',padding:'5px'},
  tab: {flex:1,padding:'9px 4px',border:'none',borderRadius:'10px',background:'none',color:'#6b6875',fontSize:'0.62rem',cursor:'pointer',letterSpacing:'0.06em'},
  tabActive: {background:'#1e1e24',color:'#f0ede8'},
  content: {padding:'0 16px'},
  soon: {textAlign:'center',color:'#6b6875',fontSize:'0.8rem',padding:'40px 0'},
}