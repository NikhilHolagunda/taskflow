import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard.jsx'

export default function Column({ id, title, tasks, onUpdate, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={`col ${isOver ? 'over' : ''}`}>
      <header><h3>{title}</h3><span className="count">{tasks.length}</span></header>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(t => (
          <TaskCard
            key={t.id}
            task={t}
            onUpdate={(patch) => onUpdate(t.id, patch)}
            onDelete={() => onDelete(t.id)}
          />
        ))}
      </SortableContext>
      {tasks.length === 0 && <p className="empty">Drop a task here</p>}
    </div>
  )
}
