import { useState } from 'react'
import { supabase } from '../supabase'

export default function SetupTab({ session, creditsData }) {
  return (
    <div style={{ padding: '8px 16px 40px' }}>

      {/* Account */}
      <div style={s.card}>
        <p style={s.label}>Logged in as</p>
        <p style={s.value}>{session.user.email || session.user.phone}</p>
        <button onClick={() => supabase.auth.signOut()} style={s.signOutBtn}>Sign out</button>
      </div>

      {/* Credits */}
      <div style={s.card}>
        <p style={s.cardTitle}>Credits</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div style={s.statBox}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.6rem', color: '#06d6a0' }}>
              {creditsData.freeRemaining}
            </div>
            <div style={s.statLabel}>Free remaining</div>
          </div>
          <div style={s.statBox}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.6rem', color: '#ff6b35' }}>
              {creditsData.paidRemaining}
            </div>
            <div style={s.statLabel}>Paid credits</div>
          </div>
        </div>

        {creditsData.totalRemaining === 0 ? (
          <div style={{ background: 'rgba(239,35,60,0.08)', border: '1px solid rgba(239,35,60,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center', marginBottom: '12px' }}>
            <p style={{ color: '#ef233c', fontSize: '0.78rem', marginBottom: '4px' }}>No credits remaining</p>
            <p style={{ color: '#6b6875', fontSize: '0.68rem' }}>Top up to continue logging readings</p>
          </div>
        ) : creditsData.freeRemaining <= 3 && creditsData.freeRemaining > 0 ? (
          <div style={{ background: 'rgba(255,209,102,0.08)', border: '1px solid rgba(255,209,102,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center', marginBottom: '12px' }}>
            <p style={{ color: '#ffd166', fontSize: '0.78rem' }}>Only {creditsData.freeRemaining} free readings left!</p>
          </div>
        ) : null}

        <button style={{ width: '100%', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer' }}
          onClick={() => alert('Payments coming soon! You will be able to top up with ₹10 for 100 readings.')}>
          ₹10 for 100 readings — Top up
        </button>
        <p style={{ fontSize: '0.65rem', color: '#6b6875', textAlign: 'center', marginTop: '8px' }}>
          Secure payment via Razorpay · UPI / Cards accepted
        </p>
      </div>

      {/* About */}
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
  cardTitle: { fontSize: '0.85rem', color: '#f0ede8', fontWeight: '500', marginBottom: '14px' },
  label: { fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6875', marginBottom: '4px' },
  value: { fontSize: '0.85rem', color: '#ff6b35', marginBottom: '14px' },
  signOutBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 16px', color: '#6b6875', fontSize: '0.72rem', cursor: 'pointer' },
  statBox: { background: '#1e1e24', borderRadius: '10px', padding: '12px', textAlign: 'center' },
  statLabel: { fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b6875', marginTop: '4px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  infoLabel: { fontSize: '0.7rem', color: '#6b6875' },
  infoVal: { fontSize: '0.7rem', color: '#f0ede8' },
}