// Demo-mode client — uses localStorage as a fake backend so the kanban works
// as a live deploy without the FastAPI server. Set VITE_API_URL to point at
// a real backend and this file will hit it instead.

const API = import.meta.env.VITE_API_URL

const TOKEN_KEY = 'taskflow.jwt'
const USER_KEY = 'taskflow.demo.user'
const TASKS_KEY = 'taskflow.demo.tasks'

function token() {
  return localStorage.getItem(TOKEN_KEY)
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

// ─── Demo helpers ──────────────────────────────────────────────────────────
function seedTasksIfEmpty() {
  const existing = localStorage.getItem(TASKS_KEY)
  if (existing) return
  const now = Date.now()
  const seed = [
    { id: 1, title: 'Try dragging me between columns', status: 'todo',  priority: 'high',   description: 'The kanban is fully working — everything persists in your browser.', created_at: now },
    { id: 2, title: 'Prep resume for job fair',        status: 'todo',  priority: 'high',   description: '', created_at: now - 1000 },
    { id: 3, title: 'Draft LinkedIn recruiter DMs',    status: 'todo',  priority: 'medium', description: '', created_at: now - 2000 },
    { id: 4, title: 'Deploy CropCast ML backend',      status: 'doing', priority: 'high',   description: 'FastAPI on Render, model loaded from pkl.', created_at: now - 3000 },
    { id: 5, title: 'Rewrite portfolio README',        status: 'doing', priority: 'medium', description: '', created_at: now - 4000 },
    { id: 6, title: 'Set up profile README',           status: 'done',  priority: 'medium', description: '', created_at: now - 5000 },
    { id: 7, title: 'Pin best repos on GitHub',        status: 'done',  priority: 'low',    description: '', created_at: now - 6000 },
    { id: 8, title: 'Add MIT LICENSE to public repos', status: 'done',  priority: 'low',    description: '', created_at: now - 7000 }
  ]
  localStorage.setItem(TASKS_KEY, JSON.stringify(seed))
}

function readTasks() {
  seedTasksIfEmpty()
  try { return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]') } catch { return [] }
}

function writeTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

function readUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

function makeToken() {
  return 'demo.' + Math.random().toString(36).slice(2) + '.' + Date.now()
}

async function demoRegister(email) {
  const user = { id: 1, email }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return { access_token: makeToken(), user }
}

async function demoLogin(email) {
  return demoRegister(email) // accept anything in demo mode
}

async function demoMe() {
  const u = readUser()
  if (!u) throw new Error('Not signed in')
  return u
}

async function demoListTasks() {
  return readTasks()
}

async function demoCreateTask(data) {
  const tasks = readTasks()
  const t = {
    id: Date.now(),
    title: data.title,
    description: data.description || '',
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    created_at: Date.now()
  }
  tasks.push(t)
  writeTasks(tasks)
  return t
}

async function demoUpdateTask(id, patch) {
  const tasks = readTasks()
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) throw new Error('Task not found')
  tasks[idx] = { ...tasks[idx], ...patch }
  writeTasks(tasks)
  return tasks[idx]
}

async function demoDeleteTask(id) {
  const tasks = readTasks().filter(t => t.id !== id)
  writeTasks(tasks)
  return null
}

// ─── Public API — chooses real or demo per call ────────────────────────────
export const api = {
  register: (email, password) => API
    ? request('/auth/register', { method: 'POST', body: { email, password } })
    : demoRegister(email),

  login: (email, password) => API
    ? request('/auth/login', { method: 'POST', body: { email, password } })
    : demoLogin(email),

  me: () => API ? request('/auth/me') : demoMe(),

  listTasks: () => API ? request('/tasks') : demoListTasks(),
  createTask: (data) => API ? request('/tasks', { method: 'POST', body: data }) : demoCreateTask(data),
  updateTask: (id, data) => API ? request(`/tasks/${id}`, { method: 'PATCH', body: data }) : demoUpdateTask(id, data),
  deleteTask: (id) => API ? request(`/tasks/${id}`, { method: 'DELETE' }) : demoDeleteTask(id),

  saveToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
  hasToken: () => !!token()
}
