const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function token() {
  return localStorage.getItem('taskflow.jwt')
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || res.statusText)
  return data
}

export const api = {
  register: (email, password) => request('/auth/register', { method: 'POST', body: { email, password } }),
  login:    (email, password) => request('/auth/login',    { method: 'POST', body: { email, password } }),
  me:       () => request('/auth/me'),
  listTasks:   () => request('/tasks'),
  createTask:  (data) => request('/tasks', { method: 'POST', body: data }),
  updateTask:  (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: data }),
  deleteTask:  (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  saveToken: (t) => localStorage.setItem('taskflow.jwt', t),
  clearToken: () => localStorage.removeItem('taskflow.jwt'),
  hasToken: () => !!token()
}
