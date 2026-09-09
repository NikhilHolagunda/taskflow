import { useState } from 'react'
import { api } from '../api/client.js'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const fn = mode === 'login' ? api.login : api.register
      const { access_token, user } = await fn(email, password)
      api.saveToken(access_token)
      onAuth(user)
    } catch (ex) {
      setErr(ex.message)
    } finally { setBusy(false) }
  }

  const isDemo = !import.meta.env.VITE_API_URL

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>TaskFlow</h1>
        <p className="muted">{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</p>
        {isDemo && (
          <div style={{
            padding: '10px 12px',
            marginBottom: 14,
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: 6,
            fontSize: 13,
            color: '#ef4444',
            lineHeight: 1.4
          }}>
            <strong>Demo mode</strong> — any email + 8+ char password works.
            Tasks persist in your browser.
          </div>
        )}
        <label>Email
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label>Password
          <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        {err && <p className="err">{err}</p>}
        <button type="submit" disabled={busy} className="btn primary">
          {busy ? '...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
        <p className="switch">
          {mode === 'login' ? 'No account?' : 'Have an account?'}{' '}
          <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </form>
    </div>
  )
}
