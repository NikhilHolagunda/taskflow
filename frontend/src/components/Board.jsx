import { useEffect, useMemo, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { api } from '../api/client.js'
import Column from './Column.jsx'

const STATUSES = [
  { id: 'todo',  title: 'To Do' },
  { id: 'doing', title: 'Doing' },
  { id: 'done',  title: 'Done' }
]

export default function Board({ user, onLogout }) {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  useEffect(() => { api.listTasks().then(setTasks).catch(console.error) }, [])

  const filtered = useMemo(() => {
    return tasks.filter(t =>
      (filter === 'all' || t.priority === filter) &&
      (search === '' || t.title.toLowerCase().includes(search.toLowerCase()))
    )
  }, [tasks, filter, search])

  const grouped = useMemo(() => {
    const g = { todo: [], doing: [], done: [] }
    for (const t of filtered) g[t.status].push(t)
    return g
  }, [filtered])

  async function addTask(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    const t = await api.createTask({ title: newTitle.trim() })
    setTasks(prev => [...prev, t])
    setNewTitle('')
  }

  async function updateTask(id, patch) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
    try { await api.updateTask(id, patch) } catch (e) { console.error(e) }
  }

  async function deleteTask(id) {
    if (!confirm('Delete this task?')) return
    setTasks(prev => prev.filter(t => t.id !== id))
    try { await api.deleteTask(id) } catch (e) { console.error(e) }
  }

  function onDragEnd(event) {
    const { active, over } = event
    if (!over) return
    const overContainer = STATUSES.find(s => s.id === over.id) ? over.id
                        : tasks.find(t => t.id === over.id)?.status
    if (!overContainer) return
    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask || activeTask.status === overContainer) return
    updateTask(active.id, { status: overContainer })
  }

  function logout() { api.clearToken(); onLogout() }

  return (
    <div className="app">
      <header className="topbar">
        <h1>TaskFlow</h1>
        <div className="topbar-right">
          <span className="muted">{user?.email}</span>
          <button className="btn small ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="toolbar">
        <form onSubmit={addTask} className="add">
          <input
            placeholder="Add a new task and press Enter…"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <button className="btn primary">Add</button>
        </form>
        <div className="filters">
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          {['all', 'low', 'medium', 'high'].map(p => (
            <button key={p} className={`chip ${filter === p ? 'on' : ''}`} onClick={() => setFilter(p)}>
              {p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        <main className="board">
          {STATUSES.map(s => (
            <Column
              key={s.id}
              id={s.id}
              title={s.title}
              tasks={grouped[s.id]}
              onUpdate={updateTask}
              onDelete={deleteTask}
            />
          ))}
        </main>
      </DndContext>
    </div>
  )
}
