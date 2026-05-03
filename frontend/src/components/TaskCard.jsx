import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const priorityColor = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' }

export default function TaskCard({ task, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [desc, setDesc] = useState(task.description || '')

  async function save() {
    await onUpdate({ title, description: desc })
    setEditing(false)
  }

  return (
    <div ref={setNodeRef} style={style} className="task" {...attributes}>
      <div className="task-handle" {...listeners} aria-label="Drag handle">⋮⋮</div>
      {editing ? (
        <div className="edit">
          <input value={title} onChange={e => setTitle(e.target.value)} />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" />
          <div className="row">
            <button className="btn small" onClick={save}>Save</button>
            <button className="btn small ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="task-top">
            <span className="dot" style={{ background: priorityColor[task.priority] }} />
            <strong onClick={() => setEditing(true)}>{task.title}</strong>
          </div>
          {task.description && <p className="muted">{task.description}</p>}
          <div className="row">
            <select value={task.priority} onChange={e => onUpdate({ priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button className="btn small ghost danger" onClick={onDelete}>Delete</button>
          </div>
        </>
      )}
    </div>
  )
}
