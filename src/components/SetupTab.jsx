import { useState } from 'react'

export default function SetupTab({ session, creditsData, onSignOut }) {
  const [patientName, setPatientName] = useState(localStorage.getItem('patientName') || '')

  return (
    <div style={{ padding: '16px 0 40px' }}>

      {/* Account */}
      <div style={s.card}>
        <p style={s.label}>Logged in as</p>
        <p style={s.value}>{session?.user?.email || session?.user?.phone || 'Guest user'}</p>
        <button onClick={onSignOut} style={s.signOutBtn}>
          {session ? 'Sign out' : 'Exit guest mode'}
        </button>
      </div>

      {/* Credits */}
      <div style={s.card}>
        <p style={s.cardTitle}>Credits</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div style={s.statBox}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.6rem', color: '#00875a' }}>
              {creditsData?.freeRemaining ?? '—'}
            </div>
            <div style={s.statLabel}>Free remaining</div>
          </div>
          <div style={s.statBox}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.6rem', color: '#ff6b35' }}>
              {creditsData?.paidRemaining ?? '—'}
            </div>
            <div style={s.statLabel}>Paid credits</div>
          </div>
        </div>
        {creditsData?.totalRemaining === 0 && (
          <div style={{ background: '#ffe5e8', border: '1px solid #ffcdd2', borderRadius: '10px', padding: '12px', textAlign: 'center', marginBottom: '12px' }}>
            <p style={{ color: '#c0003c', fontSize: '0.78rem' }}>No credits remaining — top up to continue</p>
          </div>
        )}
        <button style={{ width: '100%', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer' }}
          onClick={() => alert('Payments coming soon! ₹19 for 200 voice readings.')}>
          ₹19 for 200 voice readings — Top up
        </button>
        <p style={{ fontSize: '0.65rem', color: '#999', textAlign: 'center', marginTop: '8px' }}>
          Secure payment via Razorpay · UPI / Cards accepted
        </p>
      </div>

      {/* About */}
      <div style={s.card}>
        <p style={s.cardTitle}>About</p>
        <div style={s.infoRow}>
          <span style={s.infoLabel}>App</span>
          <span style={s.infoVal}>Defervescence</span>
        </div>
        <div style={s.infoRow}>
          <span style={s.infoLabel}>Version</span>
          <span style={s.infoVal}>0.1.0</span>
        </div>
        <div style={s.infoRow}>
          <span style={s.infoLabel}>Tagline</span>
          <span style={s.infoVal}>Smart Fever Tracker</span>
        </div>
        <div style={s.infoRow}>
          <span style={s.infoLabel}>Web</span>
          <span style={s.infoVal}>defervescence.vercel.app</span>
        </div>
      </div>

    </div>
  )
}

const s = {
  card: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '18px', padding: '18px 16px', marginBottom: '13px' },
  cardTitle: { fontSize: '0.85rem', color: '#1a1a1a', fontWeight: '500', marginBottom: '14px' },
  label: { fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '4px' },
  value: { fontSize: '0.85rem', color: '#ff6b35', marginBottom: '14px' },
  signOutBtn: { background: 'none', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '8px 16px', color: '#999', fontSize: '0.72rem', cursor: 'pointer' },
  statBox: { background: '#f7f6f3', borderRadius: '10px', padding: '12px', textAlign: 'center' },
  statLabel: { fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginTop: '4px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f0eeea' },
  infoLabel: { fontSize: '0.7rem', color: '#999' },
  infoVal: { fontSize: '0.7rem', color: '#1a1a1a' },
}