import { useEffect, useState } from 'react'
import { api } from './api/client.js'
import Auth from './components/Auth.jsx'
import Board from './components/Board.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    if (!api.hasToken()) { setBooting(false); return }
    api.me().then(setUser).catch(() => api.clearToken()).finally(() => setBooting(false))
  }, [])

  if (booting) return <div className="boot">Loading…</div>
  if (!user) return <Auth onAuth={setUser} />
  return <Board user={user} onLogout={() => setUser(null)} />
}
