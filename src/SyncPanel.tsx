import { useState } from 'react'
import type { useSync } from './useSync'

type Sync = ReturnType<typeof useSync>
const label = { off: 'Sync not configured', 'signed-out': 'Not signed in', syncing: 'Syncing…', synced: 'All changes synced', error: 'Sync error' } as const
const box = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: 11, marginBottom: 8 } as const

export default function SyncPanel({ sync }: { sync: Sync }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  if (!sync.enabled) return <div className="settings-row"><div><h3>Cross-device sync</h3><p>Paste your Firebase config in src/firebase.ts to turn this on.</p></div></div>
  const run = async (fn: () => Promise<string>) => { setBusy(true); setMsg(await fn()); setBusy(false) }
  if (sync.signedIn) return (
    <div className="settings-row"><div><h3>Cross-device sync</h3><p>{sync.email}<br />{label[sync.status]}{sync.message ? ` — ${sync.message}` : ''}</p></div>
      <button className="secondary-button" onClick={() => void sync.signOut()}>Sign out</button></div>
  )
  const valid = !!email && password.length >= 6
  return (
    <div style={{ padding: '18px 0', borderBottom: '1px solid #342a3d' }}>
      <h3 style={{ fontSize: 12, fontWeight: 550, margin: '0 0 6px' }}>Cross-device sync</h3>
      <p style={{ fontSize: 10, color: '#95839f', margin: '0 0 12px' }}>Sign in with the same account on your phone and laptop to share your library.</p>
      <button className="primary-button full-width" disabled={busy} onClick={() => void run(sync.signInGoogle)} style={{ marginBottom: 12 }}>Continue with Google</button>
      <input type="email" autoComplete="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={box} />
      <input type="password" autoComplete="current-password" placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} style={{ ...box, marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="secondary-button" disabled={busy || !valid} onClick={() => void run(() => sync.signIn(email.trim(), password))}>Sign in</button>
        <button className="secondary-button" disabled={busy || !valid} onClick={() => void run(() => sync.signUp(email.trim(), password))}>Create account</button>
      </div>
      {msg && <p className="form-error">{msg}</p>}
    </div>
  )
}
